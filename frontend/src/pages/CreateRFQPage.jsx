import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Check,
  Info, Zap, TrendingDown, Clock,
  AlertTriangle, BarChart2,
} from "lucide-react";
import { createRFQ } from "../api/rfq";
import { useToast } from "../components/ui/Toast";
import { useAuth } from "../context/AuthContext";
import { Layout, PageHeader } from "../components/ui/Layout";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { FormSection, FormRow, FormDivider } from "../components/ui/FormSection";
import { clsx } from "clsx";

// ── Steps ──────────────────────────────────────────────────
const STEPS = [
  { key: "basics",    label: "Basics",    icon: <TrendingDown size={12} /> },
  { key: "schedule",  label: "Schedule",  icon: <Clock size={12} />        },
  { key: "auction",   label: "Auction",   icon: <Zap size={12} />          },
  { key: "review",    label: "Review",    icon: <Check size={12} />         },
];

// ── Extension trigger types ────────────────────────────────
const TRIGGER_TYPES = [
  {
    key: "BID_RECEIVED",
    label: "Bid received",
    description: "Extends whenever any supplier places a bid in the trigger window",
    icon: <TrendingDown size={13} />,
  },
  {
    key: "ANY_RANK_CHANGE",
    label: "Any rank change",
    description: "Extends when any supplier changes position in the ranking",
    icon: <BarChart2 size={13} />,
  },
  {
    key: "L1_CHANGE",
    label: "L1 change only",
    description: "Extends only when the lowest bidder (L1) position changes",
    icon: <AlertTriangle size={13} />,
  },
];

// ── Default form state ─────────────────────────────────────
const toLocal = (d) => {
  // Format Date → datetime-local string (YYYY-MM-DDTHH:mm)
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const getDefaults = () => {
  const now          = new Date();
  const inOneHour    = new Date(now.getTime() + 60  * 60_000);
  const inTwoHours   = new Date(now.getTime() + 120 * 60_000);
  const inThreeHours = new Date(now.getTime() + 180 * 60_000);
  const tomorrow     = new Date(now.getTime() + 24  * 3_600_000);
  return {
    name:              "",
    currency:          "INR",
    initialPrice:      "",
    pickupDate:        toLocal(tomorrow),
    startTime:         toLocal(inOneHour),
    bidCloseTime:      toLocal(inTwoHours),
    forcedCloseTime:   toLocal(inThreeHours),
    extensionEnabled:  true,
    extensionWindow:   10,
    extensionDuration: 5,
    extensionType:     "BID_RECEIVED",
    minDecrement:      500,
    maxExtensions:     5,
    autoBidEnabled:    false,
  };
};

export default function CreateRFQPage() {
  const navigate  = useNavigate();
  const toast     = useToast();
  const { user }  = useAuth();

  const [step,    setStep]    = useState(0);
  const [form,    setForm]    = useState(getDefaults);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
    setErrors((err) => { const n = { ...err }; delete n[k]; return n; });
  };

  const setDirect = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((err) => { const n = { ...err }; delete n[k]; return n; });
  };

  // ── Validation per step ──────────────────────────────────
  const validate = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.name.trim())     e.name = "RFQ name is required";
      if (!form.initialPrice || Number(form.initialPrice) <= 0)
        e.initialPrice = "Enter a valid starting price";
    }
    if (s === 1) {
      if (!form.startTime)      e.startTime     = "Start time is required";
      if (!form.bidCloseTime)   e.bidCloseTime  = "Bid close time is required";
      if (!form.forcedCloseTime) e.forcedCloseTime = "Forced close time is required";
      if (form.bidCloseTime && form.startTime &&
          new Date(form.bidCloseTime) <= new Date(form.startTime))
        e.bidCloseTime = "Must be after start time";
      if (form.forcedCloseTime && form.bidCloseTime &&
          new Date(form.forcedCloseTime) <= new Date(form.bidCloseTime))
        e.forcedCloseTime = "Must be after bid close time";
    }
    if (s === 2 && form.extensionEnabled) {
      if (!form.extensionWindow  || Number(form.extensionWindow)  <= 0)
        e.extensionWindow  = "Required";
      if (!form.extensionDuration || Number(form.extensionDuration) <= 0)
        e.extensionDuration = "Required";
      if (!form.minDecrement || Number(form.minDecrement) <= 0)
        e.minDecrement = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  // ── Submit ───────────────────────────────────────────────
  const submit = async () => {
    setLoading(true);
    try {
      const payload = {
        name:            form.name.trim(),
        currency:        form.currency,
        initialPrice:    Number(form.initialPrice),
        pickupDate:      new Date(form.pickupDate).toISOString(),
        startTime:       new Date(form.startTime).toISOString(),
        bidCloseTime:    new Date(form.bidCloseTime).toISOString(),
        forcedCloseTime: new Date(form.forcedCloseTime).toISOString(),
        extensionEnabled:  form.extensionEnabled,
        extensionWindow:   Number(form.extensionWindow),
        extensionDuration: Number(form.extensionDuration),
        extensionType:     form.extensionType,
        minDecrement:      Number(form.minDecrement),
        maxExtensions:     Number(form.maxExtensions),
        autoBidEnabled:    form.autoBidEnabled,
      };
      const res = await createRFQ(payload);
      toast("RFQ created successfully", "info");
      navigate(`/rfqs/${res.data?.rfq?.id || res.id}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create RFQ";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Create RFQ"
        subtitle="British Auction style — suppliers compete to lower their bids"
        actions={
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-xs text-ink-4 hover:text-ink transition-colors cursor-pointer"
          >
            <ChevronLeft size={12} />
            Back
          </button>
        }
      />

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 py-6 gap-6">

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <button
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={clsx(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all",
                  i === step   && "bg-ink text-white font-medium",
                  i <  step   && "bg-surface-2 text-ink-3 hover:bg-surface-3 cursor-pointer",
                  i >  step   && "bg-surface-1 text-ink-4 cursor-not-allowed"
                )}
              >
                {i < step ? (
                  <Check size={10} />
                ) : (
                  s.icon
                )}
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={clsx(
                    "h-px w-6 transition-colors",
                    i < step ? "bg-ink/30" : "bg-surface-3"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{    opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              {step === 0 && <StepBasics form={form} set={set} errors={errors} />}
              {step === 1 && <StepSchedule form={form} set={set} errors={errors} />}
              {step === 2 && (
                <StepAuction
                  form={form}
                  set={set}
                  setDirect={setDirect}
                  errors={errors}
                />
              )}
              {step === 3 && <StepReview form={form} setStep={setStep} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-surface-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={back}
            disabled={step === 0}
            icon={<ChevronLeft size={12} />}
          >
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              size="sm"
              onClick={next}
              iconRight={<ChevronRight size={12} />}
            >
              Continue
            </Button>
          ) : (
            <Button
              size="sm"
              variant="success"
              loading={loading}
              onClick={submit}
              icon={<Check size={12} />}
            >
              Create RFQ
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}

// ── Step 0: Basics ──────────────────────────────────────────
function StepBasics({ form, set, errors }) {
  return (
    <FormSection
      title="RFQ details"
      description="Basic information about what you're sourcing"
    >
      <Input
        label="RFQ name / reference"
        placeholder="Delhi to Mumbai Shipment Q2"
        value={form.name}
        onChange={set("name")}
        error={errors.name}
      />

      <FormRow>
        <Input
          label="Starting price (ceiling)"
          type="number"
          placeholder="100000"
          value={form.initialPrice}
          onChange={set("initialPrice")}
          error={errors.initialPrice}
          prefix="₹"
          hint="Suppliers must bid below this"
        />
        <Select
          label="Currency"
          value={form.currency}
          onChange={set("currency")}
        >
          <option value="INR">INR — Indian Rupee</option>
          <option value="USD">USD — US Dollar</option>
          <option value="EUR">EUR — Euro</option>
        </Select>
      </FormRow>

      <Input
        label="Pickup / service date"
        type="datetime-local"
        value={form.pickupDate}
        onChange={set("pickupDate")}
        hint="When the service or pickup is expected"
      />
    </FormSection>
  );
}

// ── Step 1: Schedule ────────────────────────────────────────
function StepSchedule({ form, set, errors }) {
  const bidDuration = form.startTime && form.bidCloseTime
    ? Math.round(
        (new Date(form.bidCloseTime) - new Date(form.startTime)) / 60_000
      )
    : null;

  const forcedBuffer = form.bidCloseTime && form.forcedCloseTime
    ? Math.round(
        (new Date(form.forcedCloseTime) - new Date(form.bidCloseTime)) / 60_000
      )
    : null;

  const bidOrderWrong    = bidDuration    !== null && bidDuration    <= 0;
  const forcedOrderWrong = forcedBuffer   !== null && forcedBuffer   <= 0;

  return (
    <FormSection
      title="Auction schedule"
      description="Define when bidding opens, closes, and the hard deadline"
    >
      <Input
        label="Auction start time"
        type="datetime-local"
        value={form.startTime}
        onChange={set("startTime")}
        error={errors.startTime}
        hint="When suppliers can start placing bids"
      />

      <Input
        label="Bid close time"
        type="datetime-local"
        value={form.bidCloseTime}
        onChange={set("bidCloseTime")}
        error={errors.bidCloseTime || (bidOrderWrong ? "Must be after start time" : undefined)}
        hint={
          !bidOrderWrong && bidDuration != null && bidDuration > 0
            ? `Auction runs for ${bidDuration} minutes`
            : !bidOrderWrong
            ? "Normal close — may be extended automatically"
            : undefined
        }
      />

      <Input
        label="Forced close time"
        type="datetime-local"
        value={form.forcedCloseTime}
        onChange={set("forcedCloseTime")}
        error={errors.forcedCloseTime || (forcedOrderWrong ? "Must be after bid close time" : undefined)}
        hint={
          !forcedOrderWrong && forcedBuffer != null && forcedBuffer > 0
            ? `Hard deadline — ${forcedBuffer} min buffer after bid close`
            : !forcedOrderWrong
            ? "Auction will never extend beyond this time"
            : undefined
        }
      />

      {form.startTime && form.bidCloseTime && form.forcedCloseTime &&
        !bidOrderWrong && !forcedOrderWrong && (
          <SchedulePreview form={form} />
        )}
    </FormSection>
  );
}

function SchedulePreview({ form }) {
  const start  = new Date(form.startTime);
  const close  = new Date(form.bidCloseTime);
  const forced = new Date(form.forcedCloseTime);

  const total  = forced - start;
  const closeP = Math.min(100, ((close - start) / total) * 100);

  const fmt = (d) =>
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <div className="bg-surface-2 rounded-lg p-3 flex flex-col gap-2">
      <p className="text-2xs text-ink-4 font-medium">Timeline preview</p>
      <div className="relative h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-bid rounded-full"
          style={{ width: `${closeP}%` }}
        />
        <div className="absolute left-0 top-0 h-full bg-warn/50 rounded-full w-full" />
        <div
          className="absolute left-0 top-0 h-full bg-bid rounded-full"
          style={{ width: `${closeP}%` }}
        />
      </div>
      <div className="flex justify-between text-2xs text-ink-4">
        <span>{fmt(start)}</span>
        <span className="text-warn">{fmt(close)} close</span>
        <span className="text-close">{fmt(forced)} forced</span>
      </div>
    </div>
  );
}

// ── Step 2: Auction config ──────────────────────────────────
function StepAuction({ form, set, setDirect, errors }) {
  return (
    <div className="flex flex-col gap-6">
      <FormSection
        title="Extension settings"
        description="Control when and how the auction auto-extends"
      >
        {/* Extension toggle */}
        <div onClick={() => setDirect("extensionEnabled", !form.extensionEnabled)} className="flex items-center justify-between p-3 bg-surface-2 rounded-lg cursor-pointer hover:bg-surface-3 transition-colors">
          <p className="text-xs font-medium text-ink">Enable auto-extension</p>
          <p className="text-2xs text-ink-4 mt-0.5">
            Auction extends when bids come in near closing time
          </p>
        </div>
        <div
          className={clsx(
            "w-8 h-4.5 rounded-full transition-colors duration-200 relative cursor-pointer",
            form.extensionEnabled ? "bg-ink" : "bg-surface-3"
          )}
        >
          <div
            className={clsx(
              "absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform duration-200",
              form.extensionEnabled ? "translate-x-4.5" : "translate-x-0.5"
            )}
          />
        </div>

        <AnimatePresence>
          {form.extensionEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{    opacity: 0, height: 0 }}
              className="overflow-hidden flex flex-col gap-3"
            >
              {/* Trigger window + duration */}
              <FormRow>
                <Input
                  label="Trigger window (X minutes)"
                  type="number"
                  min="1"
                  max="60"
                  value={form.extensionWindow}
                  onChange={set("extensionWindow")}
                  error={errors.extensionWindow}
                  suffix="min"
                  hint="Monitor this many minutes before close"
                />
                <Input
                  label="Extension duration (Y minutes)"
                  type="number"
                  min="1"
                  max="60"
                  value={form.extensionDuration}
                  onChange={set("extensionDuration")}
                  error={errors.extensionDuration}
                  suffix="min"
                  hint="Add this much time when triggered"
                />
              </FormRow>

              {/* Extension type selector */}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-ink-3 font-medium tracking-wide">
                  Extension trigger
                </p>
                <div className="flex flex-col gap-2">
                  {TRIGGER_TYPES.map((t) => (
                    <motion.button
                      key={t.key}
                      type="button"
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setDirect("extensionType", t.key)}
                      className={clsx(
                        "flex items-start gap-3 p-3 rounded-lg border text-left transition-all duration-150, cursor-pointer",
                        form.extensionType === t.key
                          ? "border-ink bg-ink text-white"
                          : "border-surface-3 bg-white hover:border-ink/30"
                      )}
                    >
                      <span
                        className={clsx(
                          "mt-0.5 shrink-0 transition-colors",
                          form.extensionType === t.key
                            ? "text-white"
                            : "text-ink-3"
                        )}
                      >
                        {t.icon}
                      </span>
                      <div>
                        <p className="text-xs font-medium">{t.label}</p>
                        <p
                          className={clsx(
                            "text-2xs mt-0.5 leading-relaxed",
                            form.extensionType === t.key
                              ? "text-white/60"
                              : "text-ink-4"
                          )}
                        >
                          {t.description}
                        </p>
                      </div>
                      {form.extensionType === t.key && (
                        <Check size={12} className="ml-auto shrink-0 mt-0.5" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              <FormRow>
                <Input
                  label="Max extensions"
                  type="number"
                  min="1"
                  max="20"
                  value={form.maxExtensions}
                  onChange={set("maxExtensions")}
                  hint="Cap on how many times it can extend"
                />
              </FormRow>
            </motion.div>
          )}
        </AnimatePresence>
      </FormSection>

      <FormDivider />

      <FormSection
        title="Bidding rules"
        description="Constraints that apply to every bid submitted"
      >
        <FormRow>
          <Input
            label="Minimum decrement"
            type="number"
            min="1"
            value={form.minDecrement}
            onChange={set("minDecrement")}
            error={errors.minDecrement}
            prefix="₹"
            hint="Each bid must be lower by at least this amount"
          />
        </FormRow>

        {/* Auto-bid toggle */} 
        <div onClick={() => setDirect("autoBidEnabled", !form.autoBidEnabled)} className="flex items-center justify-between p-3 bg-surface-2 rounded-lg cursor-pointer hover:bg-surface-3 transition-colors">
          <p className="text-xs font-medium text-ink">Enable auto-bidding</p>
          <p className="text-2xs text-ink-4 mt-0.5">
            Suppliers can set a max price and let the system bid on their behalf
          </p>
        </div>
        <div
          className={clsx(
            "w-8 h-4.5 rounded-full transition-colors duration-200 relative cursor-pointer",
            form.autoBidEnabled ? "bg-ink" : "bg-surface-3"
          )}
        >
          <div
            className={clsx(
              "absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform duration-200",
              form.autoBidEnabled ? "translate-x-4.5" : "translate-x-0.5"
            )}
          />
        </div> 
      </FormSection>
    </div>
  );
}

// ── Step 3: Review ──────────────────────────────────────────
function StepReview({ form, setStep }) {
  const triggerLabel = TRIGGER_TYPES.find(
    (t) => t.key === form.extensionType
  )?.label;

  const rows = [
    { section: "Basics", items: [
      ["RFQ name",       form.name],
      ["Starting price", `₹${Number(form.initialPrice).toLocaleString("en-IN")}`],
      ["Currency",       form.currency],
    ]},
    { section: "Schedule", items: [
      ["Start",        new Date(form.startTime).toLocaleString("en-IN")],
      ["Bid close",    new Date(form.bidCloseTime).toLocaleString("en-IN")],
      ["Forced close", new Date(form.forcedCloseTime).toLocaleString("en-IN")],
    ]},
    { section: "Auction config", items: [
      ["Auto-extension",  form.extensionEnabled ? "Enabled" : "Disabled"],
      ...(form.extensionEnabled
        ? [
            ["Trigger window",  `${form.extensionWindow} min`],
            ["Extension by",    `${form.extensionDuration} min`],
            ["Trigger type",    triggerLabel],
            ["Max extensions",  form.maxExtensions],
          ]
        : []),
      ["Min decrement",   `₹${Number(form.minDecrement).toLocaleString("en-IN")}`],
      ["Auto-bidding",    form.autoBidEnabled ? "Enabled" : "Disabled"],
    ]},
  ];

  return (
    <FormSection
      title="Review & confirm"
      description="Check everything before creating the RFQ"
    >
      <div className="flex flex-col gap-4">
        {rows.map(({ section, items }, si) => (
          <div key={section} className="bg-white border border-surface-3 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-surface-1 border-b border-surface-2">
              <p className="text-2xs font-medium text-ink-3 uppercase tracking-wider">
                {section}
              </p>
              <button
                onClick={() => setStep(si)}
                className="text-2xs text-ink-4 hover:text-ink underline-offset-2 hover:underline transition-colors"
              >
                Edit
              </button>
            </div>
            <div className="divide-y divide-surface-2">
              {items.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between px-3 py-2">
                  <span className="text-2xs text-ink-4">{label}</span>
                  <span className="text-xs font-medium text-ink">{value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Warning box */}
        <div className="flex items-start gap-2 p-3 bg-warn-light border border-warn/20 rounded-lg">
          <Info size={12} className="text-warn shrink-0 mt-0.5" />
          <p className="text-2xs text-warn leading-relaxed">
            Once created, the RFQ will be in <strong>Draft</strong> status. Activate
            it from the detail page to start accepting bids.
          </p>
        </div>
      </div>
    </FormSection>
  );
}