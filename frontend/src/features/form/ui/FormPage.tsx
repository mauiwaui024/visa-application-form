import { FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { submitForm } from "../api/submitForm";
import {
  createInitialSubmitFormRequest,
  type EmploymentDetails,
  type PersonalDetails,
  type SecurityAndBackgroundDetails,
  type SubmitFormRequest,
  type TravelHistoryDetails,
  type TripDetails,
  type TripRecord,
  type YesNo,
} from "../model/types";
import {
  hasAnyTripData,
  isBusinessPurpose,
  validateForm,
  validateFormStep,
  WIZARD_STEP_COUNT,
} from "./formValidation";

type SelectOption = {
  value: string;
  label: string;
};

const yesNoOptions: SelectOption[] = [
  { value: "", label: "Выберите вариант" },
  { value: "yes", label: "Да" },
  { value: "no", label: "Нет" },
];

const toggleArrayValue = (items: string[], value: string): string[] => {
  if (items.includes(value)) {
    return items.filter((item) => item !== value);
  }

  return [...items, value];
};

const createEmptyTripRecord = (): TripRecord => ({
  purpose: "",
  entryDate: "",
  exitDate: "",
  daysStayed: "",
  country: "",
});

const getFilledTripCount = (records: TripRecord[]): number => {
  let lastFilledIndex = -1;
  records.forEach((record, index) => {
    if (
      record.purpose.trim() !== "" ||
      record.entryDate.trim() !== "" ||
      record.exitDate.trim() !== "" ||
      record.daysStayed.trim() !== "" ||
      record.country.trim() !== ""
    ) {
      lastFilledIndex = index;
    }
  });

  return lastFilledIndex + 1;
};

const MAX_UK_TRIPS = 3;
const MAX_MAJOR_TRIPS = 2;
const MAX_OTHER_TRIPS = 3;

const DRAFT_STORAGE_V2 = "visa_application_form_draft_v2";
const DRAFT_STORAGE_V1 = "visa_application_form_draft_v1";

const WIZARD_STEP_LABELS = [
  "Личные данные",
  "Паспортные данные",
  "Трудоустройство / Занятость и доходы",
  "Информация о поездке в Великобританию",
  "Информация о членах семьи и родителях",
  "Информация о поездках",
  "Судимость и другие виды наказаний",
] as const;

function clampWizardStep(value: number): number {
  if (Number.isNaN(value) || value < 0) {
    return 0;
  }
  if (value >= WIZARD_STEP_COUNT) {
    return WIZARD_STEP_COUNT - 1;
  }
  return value;
}

function loadDraftFromStorage(): { form: SubmitFormRequest; activeStepIndex: number } {
  const initialState = createInitialSubmitFormRequest();
  try {
    const rawV2 = localStorage.getItem(DRAFT_STORAGE_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as { form?: Partial<SubmitFormRequest>; activeStepIndex?: number };
      if (parsed?.form) {
        return {
          form: { ...initialState, ...parsed.form },
          activeStepIndex: clampWizardStep(Number(parsed.activeStepIndex) || 0),
        };
      }
    }
    const rawV1 = localStorage.getItem(DRAFT_STORAGE_V1);
    if (rawV1) {
      const parsed = JSON.parse(rawV1) as Partial<SubmitFormRequest>;
      return {
        form: { ...initialState, ...parsed },
        activeStepIndex: 0,
      };
    }
  } catch {
    // ignore
  }
  return { form: initialState, activeStepIndex: 0 };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="form-section">
      <h2>{title}</h2>
      <div className="form-grid">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label>
      <span className="required-label">
        <span className="required-mark">*</span>
        <span>{label}</span>
      </span>
      {children}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
  type = "text",
  pattern,
  title,
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "email" | "date" | "month" | "number" | "tel";
  pattern?: string;
  title?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
}) {
  const resolvedInputMode =
    inputMode ?? (type === "email" ? "email" : type === "tel" ? "tel" : type === "number" ? "decimal" : undefined);

  return (
    <Field label={label}>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        pattern={pattern}
        title={title}
        inputMode={resolvedInputMode}
        autoComplete={autoComplete}
      />
    </Field>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
      />
    </Field>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  required?: boolean;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      >
        {options.map((option) => (
          <option key={option.value || "empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function FormPage() {
  const [initialDraft] = useState(() => loadDraftFromStorage());
  const [form, setForm] = useState<SubmitFormRequest>(initialDraft.form);
  const [activeStepIndex, setActiveStepIndex] = useState(initialDraft.activeStepIndex);
  const [status, setStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [visibleUkTrips, setVisibleUkTrips] = useState(1);
  const [visibleMajorTrips, setVisibleMajorTrips] = useState(0);
  const [visibleOtherTrips, setVisibleOtherTrips] = useState(0);
  const wizardScrollAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem(
      DRAFT_STORAGE_V2,
      JSON.stringify({ form, activeStepIndex }),
    );
  }, [form, activeStepIndex]);

  useEffect(() => {
    setVisibleUkTrips((prev) =>
      Math.max(prev, Math.min(MAX_UK_TRIPS, Math.max(1, getFilledTripCount(form.travelHistory.ukTripHistory)))),
    );
    setVisibleMajorTrips((prev) => Math.min(MAX_MAJOR_TRIPS, Math.max(0, prev)));
    setVisibleOtherTrips((prev) => Math.min(MAX_OTHER_TRIPS, Math.max(0, prev)));
  }, [
    form.travelHistory.ukTripHistory,
    form.travelHistory.majorCountryTrips,
    form.travelHistory.otherCountryTrips,
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) {
      return;
    }

    const threshold = 120;
    const handleViewportResize = () => {
      const keyboardVisible = window.innerHeight - window.visualViewport!.height > threshold;
      setIsKeyboardOpen(keyboardVisible);
    };

    window.visualViewport.addEventListener("resize", handleViewportResize);
    handleViewportResize();

    return () => {
      window.visualViewport?.removeEventListener("resize", handleViewportResize);
    };
  }, []);

  useEffect(() => {
    if (status !== "Анкета успешно отправлена") {
      return;
    }
    const timer = window.setTimeout(() => setStatus(""), 2800);
    return () => window.clearTimeout(timer);
  }, [status]);

  const updatePersonal = <K extends keyof PersonalDetails>(
    key: K,
    value: PersonalDetails[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      personalDetails: {
        ...prev.personalDetails,
        [key]: value,
      },
    }));
  };

  const updateEmployment = <K extends keyof EmploymentDetails>(
    key: K,
    value: EmploymentDetails[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      employmentAndFinance: {
        ...prev.employmentAndFinance,
        [key]: value,
      },
    }));
  };

  const updateTrip = <K extends keyof TripDetails>(
    key: K,
    value: TripDetails[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      tripDetails: {
        ...prev.tripDetails,
        [key]: value,
      },
    }));
  };

  const updateTravelHistory = <K extends keyof TravelHistoryDetails>(
    key: K,
    value: TravelHistoryDetails[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      travelHistory: {
        ...prev.travelHistory,
        [key]: value,
      },
    }));
  };

  const updateSecurity = <K extends keyof SecurityAndBackgroundDetails>(
    key: K,
    value: SecurityAndBackgroundDetails[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      securityAndBackground: {
        ...prev.securityAndBackground,
        [key]: value,
      },
    }));
  };

  const updateTripArray = (
    section: "ukTripHistory" | "majorCountryTrips" | "otherCountryTrips",
    index: number,
    key: keyof TripRecord,
    value: string,
  ) => {
    setForm((prev) => {
      const nextArray = prev.travelHistory[section].map((record, recordIndex) =>
        recordIndex === index ? { ...record, [key]: value } : record,
      ) as TravelHistoryDetails[typeof section];

      return {
        ...prev,
        travelHistory: {
          ...prev.travelHistory,
          [section]: nextArray,
        },
      };
    });
  };

  const revealNextTrip = (
    section: "ukTripHistory" | "majorCountryTrips" | "otherCountryTrips",
    maxCount: number,
    currentVisible: number,
    setVisible: (value: number | ((prev: number) => number)) => void,
  ) => {
    const nextVisible = Math.min(maxCount, currentVisible + 1);

    setForm((prev) => {
      const current = [...prev.travelHistory[section]] as TripRecord[];
      while (current.length < nextVisible) {
        current.push(createEmptyTripRecord());
      }

      return {
        ...prev,
        travelHistory: {
          ...prev.travelHistory,
          [section]: current as TravelHistoryDetails[typeof section],
        },
      };
    });

    setVisible(nextVisible);
  };

  const removeTripForm = (
    section: "majorCountryTrips" | "otherCountryTrips",
    index: number,
    setVisible: (value: number | ((prev: number) => number)) => void,
  ) => {
    setForm((prev) => {
      const current = [...prev.travelHistory[section]] as TripRecord[];
      current.splice(index, 1);
      current.push(createEmptyTripRecord());

      return {
        ...prev,
        travelHistory: {
          ...prev.travelHistory,
          [section]: current as TravelHistoryDetails[typeof section],
        },
      };
    });

    setVisible((prev) => Math.max(0, prev - 1));
  };

  const updateYesNo = <K extends keyof SubmitFormRequest["passportDetails"]>(
    section: "passportDetails",
    key: K,
    value: YesNo,
  ) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const scrollWizardToTop = () => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    wizardScrollAnchorRef.current?.scrollIntoView({
      block: "start",
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  const focusFirstFieldInActiveSection = () => {
    const section = document.querySelector(".form-wizard .form-section");
    if (!section) {
      return;
    }
    const firstInvalid = section.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      "input:invalid, select:invalid, textarea:invalid",
    );
    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: false });
      return;
    }
    const firstFocusable = section.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      "input, select, textarea",
    );
    firstFocusable?.focus({ preventScroll: false });
  };

  const goNext = () => {
    const validationError = validateFormStep(activeStepIndex, form);
    if (validationError) {
      setStatus(validationError);
      scrollWizardToTop();
      window.setTimeout(focusFirstFieldInActiveSection, 80);
      return;
    }
    setStatus("");
    setActiveStepIndex((index) => Math.min(WIZARD_STEP_COUNT - 1, index + 1));
  };

  const goBack = () => {
    setStatus("");
    setActiveStepIndex((index) => Math.max(0, index - 1));
    scrollWizardToTop();
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeStepIndex < WIZARD_STEP_COUNT - 1) {
      goNext();
      return;
    }
    void handleFinalSubmit();
  };

  const handleFinalSubmit = async () => {
    setStatus("");

    const validationError = validateForm(form);
    if (validationError) {
      setStatus(validationError);
      scrollWizardToTop();
      window.setTimeout(focusFirstFieldInActiveSection, 80);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await submitForm(form);
      setStatus(response.status === "ok" ? "Анкета успешно отправлена" : "Неизвестный ответ сервера");
      setForm(createInitialSubmitFormRequest());
      setActiveStepIndex(0);
      setVisibleUkTrips(1);
      setVisibleMajorTrips(0);
      setVisibleOtherTrips(0);
      localStorage.removeItem(DRAFT_STORAGE_V1);
      localStorage.removeItem(DRAFT_STORAGE_V2);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось отправить анкету";
      setStatus(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showPreviousAddress = Number(form.personalDetails.yearsAtAddress || "0") < 2;
  const showOtherPassport = form.passportDetails.hasOtherPassport === "yes";
  const showOtherIncome = form.employmentAndFinance.hasOtherIncome === "yes";
  const showSavingsBalance = form.employmentAndFinance.hasSavings === "yes";
  const showTripSponsor = form.employmentAndFinance.hasTripSponsor === "yes";
  const showCompanion = form.tripDetails.travelWithNonDependent === "yes";
  const showBusinessTrip =
    form.tripDetails.isBusinessTrip === "yes" ||
    isBusinessPurpose(form.tripDetails.primaryPurpose);
  const showSpouseFields = form.personalDetails.maritalStatus === "married";
  const showChildFields = form.familyAndDependants.childDependant.hasDependants === "yes";
  const showChildAddress =
    showChildFields &&
    form.familyAndDependants.childDependant.childLivesWithApplicant === "no";
  const showUkRelatives = form.familyAndDependants.hasUkRelatives === "yes";
  const showUkVisaMonthYear = form.travelHistory.hadUkVisaBefore === "yes";
  const showUkTrips = form.travelHistory.ukVisitsLast10Years !== "none" && form.travelHistory.ukVisitsLast10Years !== "";
  const showUkRefusalDetails =
    form.travelHistory.hadUkVisaRefusal === "yes" ||
    form.travelHistory.hadUkEntryRefusal === "yes" ||
    form.travelHistory.hadUkDeportation === "yes";
  const showOtherRefusalDetails =
    form.travelHistory.hadOtherVisaRefusal === "yes" ||
    form.travelHistory.hadOtherEntryRefusal === "yes" ||
    form.travelHistory.hadOtherDeportation === "yes";
  const showAbroadTrips =
    form.travelHistory.traveledAbroadLast10YearsExcludingUk === "yes";
  const showCriminalDetails =
    form.securityAndBackground.convictedCriminalOffence === "yes" ||
    form.securityAndBackground.trafficOffencePenalty === "yes" ||
    form.securityAndBackground.chargedOrAwaitingTrial === "yes" ||
    form.securityAndBackground.warningOrOtherPenalty === "yes" ||
    form.securityAndBackground.civilJudgementOrBankruptcy === "yes";
  const showSecurityDetails =
    form.securityAndBackground.involvedInWarCrimesOrGenocide === "yes" ||
    form.securityAndBackground.involvedWithTerroristOrganization === "yes" ||
    form.securityAndBackground.expressedTerrorismSupportViews === "yes";
  const showListedOrganizations =
    form.securityAndBackground.workedInListedOrganizations === "yes";

  const stepNumber = activeStepIndex + 1;
  const progressPercent = (stepNumber / WIZARD_STEP_COUNT) * 100;
  const isLastStep = activeStepIndex === WIZARD_STEP_COUNT - 1;
  const isStatusSuccess = status === "Анкета успешно отправлена";

  return (
    <main className={`container form-wizard-page${isKeyboardOpen ? " keyboard-open" : ""}`}>
      <h1>ОПРОСНЫЙ ЛИСТ</h1>
      {status ? (
        <div
          className={`status-toast ${isStatusSuccess ? "status-toast-success" : "status-toast-error"}`}
          role={isStatusSuccess ? "status" : "alert"}
          aria-live={isStatusSuccess ? "polite" : "assertive"}
        >
          {status}
        </div>
      ) : null}
      <div
        ref={wizardScrollAnchorRef}
        className="form-wizard-progress"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={WIZARD_STEP_COUNT}
        aria-valuenow={stepNumber}
        aria-label={`Шаг ${stepNumber} из ${WIZARD_STEP_COUNT}: ${WIZARD_STEP_LABELS[activeStepIndex]}`}
      >
        <div className="form-wizard-progress-text">
          Шаг {stepNumber} из {WIZARD_STEP_COUNT}
        </div>
        <div className="form-wizard-progress-bar" aria-hidden="true">
          <div
            className="form-wizard-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      <form className="form form-wizard" onSubmit={handleFormSubmit}>
        {activeStepIndex === 0 ? (
        <Section title="Личные данные">
          <TextField
            label="1. Фамилия, имя, отчество (по заграничному паспорту)"
            value={form.personalDetails.fullNamePassport}
            onChange={(value) => updatePersonal("fullNamePassport", value)}
            required
          />
          <TextField
            label="2. Другие имена и фамилии, включая девичью фамилию"
            value={form.personalDetails.otherNames}
            onChange={(value) => updatePersonal("otherNames", value)}
          />
          <TextAreaField
            label="3. Ваш фактический адрес проживания"
            value={form.personalDetails.residentialAddress}
            onChange={(value) => updatePersonal("residentialAddress", value)}
          />
          <TextField
            label="3.1 Индекс фактического адреса"
            value={form.personalDetails.residentialAddressPostalCode}
            onChange={(value) => updatePersonal("residentialAddressPostalCode", value)}
            inputMode="numeric"
            autoComplete="postal-code"
          />
          <TextField
            label="4. Как долго Вы проживаете по данному адресу? (лет)"
            type="number"
            value={form.personalDetails.yearsAtAddress}
            onChange={(value) => updatePersonal("yearsAtAddress", value)}
            required
          />
          <TextField
            label="4. Как долго Вы проживаете по данному адресу? (месяцев)"
            type="number"
            value={form.personalDetails.monthsAtAddress}
            onChange={(value) => updatePersonal("monthsAtAddress", value)}
            required
          />
          {showPreviousAddress ? (
            <>
              <TextAreaField
                label="4.1 Прошлое место проживания"
                value={form.personalDetails.previousAddress}
                onChange={(value) => updatePersonal("previousAddress", value)}
              />
              <TextField
                label="4.1 Дата проживания с"
                type="date"
                value={form.personalDetails.previousAddressFrom}
                onChange={(value) => updatePersonal("previousAddressFrom", value)}
              />
              <TextField
                label="4.1 Дата проживания по"
                type="date"
                value={form.personalDetails.previousAddressTo}
                onChange={(value) => updatePersonal("previousAddressTo", value)}
              />
            </>
          ) : null}
          <TextField
            label="5. Мобильный телефон"
            type="tel"
            value={form.personalDetails.mobilePhone}
            onChange={(value) => updatePersonal("mobilePhone", value)}
            pattern="^\+?[0-9]+$"
            title="Введите только цифры и, при необходимости, + в начале номера"
            inputMode="tel"
            autoComplete="tel"
            required
          />
          <TextField
            label="5.1 Email"
            type="email"
            value={form.personalDetails.email}
            onChange={(value) => updatePersonal("email", value)}
            inputMode="email"
            autoComplete="email"
            required
          />
          <SelectField
            label="6. Являетесь ли Вы собственником жилья, в котором проживаете?"
            value={form.personalDetails.housingStatus}
            onChange={(value) =>
              updatePersonal("housingStatus", value as PersonalDetails["housingStatus"])
            }
            options={[
              { value: "", label: "Выберите вариант" },
              { value: "owner", label: "Являюсь собственником" },
              { value: "rent", label: "Снимаю это жилье" },
              { value: "family", label: "Живу со своей семьей" },
              { value: "other", label: "Другое" },
            ]}
            required
          />
          {form.personalDetails.housingStatus === "other" ? (
            <TextAreaField
              label="6.1 Другое (укажите подробности)"
              value={form.personalDetails.housingStatusDetails}
              onChange={(value) => updatePersonal("housingStatusDetails", value)}
            />
          ) : null}
          <SelectField
            label="7. Ваше семейное положение"
            value={form.personalDetails.maritalStatus}
            onChange={(value) =>
              updatePersonal("maritalStatus", value as PersonalDetails["maritalStatus"])
            }
            options={[
              { value: "", label: "Выберите вариант" },
              { value: "single", label: "Холост / не замужем" },
              { value: "married", label: "Женат / замужем / Гражданский брак" },
              { value: "divorced", label: "Разведен(а) / отношения расторгнуты" },
              { value: "widowed", label: "Вдова / вдовец" },
            ]}
            required
          />
          <TextField
            label="8. Ваше гражданство"
            value={form.personalDetails.citizenship}
            onChange={(value) => updatePersonal("citizenship", value)}
            required
          />
          <TextField
            label="8.1 Есть ли у Вас второе гражданство? Укажите страну"
            value={form.personalDetails.secondCitizenshipCountry}
            onChange={(value) => updatePersonal("secondCitizenshipCountry", value)}
          />
          <TextField
            label="8.2 Было ли у Вас иное гражданство? Укажите страну"
            value={form.personalDetails.otherCitizenshipCountry}
            onChange={(value) => updatePersonal("otherCitizenshipCountry", value)}
          />
          <TextField
            label="9. Дата рождения"
            type="date"
            value={form.personalDetails.birthDate}
            onChange={(value) => updatePersonal("birthDate", value)}
            required
          />
          <TextField
            label="10. Страна рождения"
            value={form.personalDetails.birthCountry}
            onChange={(value) => updatePersonal("birthCountry", value)}
            required
          />
          <TextAreaField
            label="11. Место рождения (полностью)"
            value={form.personalDetails.birthPlace}
            onChange={(value) => updatePersonal("birthPlace", value)}
          />
        </Section>
        ) : null}

        {activeStepIndex === 1 ? (
        <Section title="Паспортные данные">
          <TextField
            label="12. Номер действующего заграничного паспорта"
            value={form.passportDetails.currentPassportNumber}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                passportDetails: {
                  ...prev.passportDetails,
                  currentPassportNumber: value,
                },
              }))
            }
            required
          />
          <TextField
            label="13. Орган, выдавший загранпаспорт (ФМС / УФМС)"
            value={form.passportDetails.currentPassportIssuingAuthority}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                passportDetails: {
                  ...prev.passportDetails,
                  currentPassportIssuingAuthority: value,
                },
              }))
            }
            required
          />
          <TextField
            label="14. Срок действия действующего загранпаспорта: дата начала"
            type="date"
            value={form.passportDetails.currentPassportValidFrom}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                passportDetails: {
                  ...prev.passportDetails,
                  currentPassportValidFrom: value,
                },
              }))
            }
          />
          <TextField
            label="14. Срок действия действующего загранпаспорта: дата окончания"
            type="date"
            value={form.passportDetails.currentPassportValidTo}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                passportDetails: {
                  ...prev.passportDetails,
                  currentPassportValidTo: value,
                },
              }))
            }
            required
          />
          <SelectField
            label="15. Имеется ли у Вас другой загранпаспорт?"
            value={form.passportDetails.hasOtherPassport}
            onChange={(value) => updateYesNo("passportDetails", "hasOtherPassport", value as YesNo)}
            options={yesNoOptions}
            required
          />
          {showOtherPassport ? (
            <>
              <TextField
                label="16. Номер паспорта"
                value={form.passportDetails.otherPassportNumber}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    passportDetails: {
                      ...prev.passportDetails,
                      otherPassportNumber: value,
                    },
                  }))
                }
              />
              <TextField
                label="16. Орган выдачи"
                value={form.passportDetails.otherPassportIssuingAuthority}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    passportDetails: {
                      ...prev.passportDetails,
                      otherPassportIssuingAuthority: value,
                    },
                  }))
                }
              />
              <TextField
                label="16. Дата выдачи"
                type="date"
                value={form.passportDetails.otherPassportIssueDate}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    passportDetails: {
                      ...prev.passportDetails,
                      otherPassportIssueDate: value,
                    },
                  }))
                }
              />
              <TextField
                label="16. Дата окончания"
                type="date"
                value={form.passportDetails.otherPassportExpiryDate}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    passportDetails: {
                      ...prev.passportDetails,
                      otherPassportExpiryDate: value,
                    },
                  }))
                }
              />
            </>
          ) : null}
          <TextField
            label="17. Номер общегражданского паспорта"
            value={form.passportDetails.nationalPassportNumber}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                passportDetails: {
                  ...prev.passportDetails,
                  nationalPassportNumber: value,
                },
              }))
            }
          />
        </Section>
        ) : null}

        {activeStepIndex === 2 ? (
        <Section title="Трудоустройство / Занятость и доходы">
          <Field label="18. Каков Ваш статус занятости? (можно выбрать более одного варианта)">
            <div className="checkbox-list">
              {[
                ["fullTime", "Полная занятость"],
                ["entrepreneur", "Частный предприниматель"],
                ["student", "Студент / школьник"],
                ["retired", "Пенсионер"],
                ["unemployed", "Неработающий"],
              ].map(([value, label]) => (
                <label key={value} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={form.employmentAndFinance.employmentStatuses.includes(
                      value as EmploymentDetails["employmentStatuses"][number],
                    )}
                    onChange={() =>
                      updateEmployment(
                        "employmentStatuses",
                        toggleArrayValue(
                          form.employmentAndFinance.employmentStatuses,
                          value,
                        ) as EmploymentDetails["employmentStatuses"],
                      )
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </Field>
          <TextField
            label="19. Название организации, в которой Вы работаете"
            value={form.employmentAndFinance.organizationName}
            onChange={(value) => updateEmployment("organizationName", value)}
          />
          <TextAreaField
            label="20. Полный адрес организации"
            value={form.employmentAndFinance.organizationAddress}
            onChange={(value) => updateEmployment("organizationAddress", value)}
          />
          <TextField
            label="21. Рабочий телефон"
            value={form.employmentAndFinance.workPhone}
            onChange={(value) => updateEmployment("workPhone", value)}
          />
          <TextField
            label="22. Дата начала работы"
            type="date"
            value={form.employmentAndFinance.workStartDate}
            onChange={(value) => updateEmployment("workStartDate", value)}
          />
          <TextField
            label="23. Ваша должность"
            value={form.employmentAndFinance.position}
            onChange={(value) => updateEmployment("position", value)}
          />
          <TextField
            label="24. Сколько Вы зарабатываете в месяц после уплаты налогов?"
            value={form.employmentAndFinance.monthlyIncomeAfterTax}
            onChange={(value) => updateEmployment("monthlyIncomeAfterTax", value)}
          />
          <TextAreaField
            label="25. В чем заключается Ваша работа?"
            value={form.employmentAndFinance.workDescription}
            onChange={(value) => updateEmployment("workDescription", value)}
          />
          <SelectField
            label="26. Получаете ли Вы доход из других источников?"
            value={form.employmentAndFinance.hasOtherIncome}
            onChange={(value) => updateEmployment("hasOtherIncome", value as YesNo)}
            options={yesNoOptions}
          />
          {showOtherIncome ? (
            <>
              <Field label="37.1 Укажите источники дохода из других источников">
                <div className="checkbox-list">
                  {[
                    ["family", "Пособие или регулярные денежные суммы от семьи"],
                    ["pension", "Пенсия"],
                    ["investments", "Инвестиции"],
                    ["rent", "Сдача в аренду недвижимости"],
                  ].map(([value, label]) => (
                    <label key={value} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={form.employmentAndFinance.otherIncomeSources.includes(
                          value as EmploymentDetails["otherIncomeSources"][number],
                        )}
                        onChange={() =>
                          updateEmployment(
                            "otherIncomeSources",
                            toggleArrayValue(
                              form.employmentAndFinance.otherIncomeSources,
                              value,
                            ) as EmploymentDetails["otherIncomeSources"],
                          )
                        }
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </Field>
              <TextField
                label="37.1 Общая сумма дохода за год из других источников"
                value={form.employmentAndFinance.otherIncomeTotalYear}
                onChange={(value) => updateEmployment("otherIncomeTotalYear", value)}
              />
            </>
          ) : null}
          <SelectField
            label="27. Имеете ли Вы собственные сбережения, счет в банке?"
            value={form.employmentAndFinance.hasSavings}
            onChange={(value) => updateEmployment("hasSavings", value as YesNo)}
            options={yesNoOptions}
          />
          {showSavingsBalance ? (
            <TextField
              label="28. Если да, укажите сумму исходящего остатка по справке"
              value={form.employmentAndFinance.savingsBalance}
              onChange={(value) => updateEmployment("savingsBalance", value)}
            />
          ) : null}
          <TextField
            label="29. Сумма ваших ежемесячных расходов (включая расходы на иждивенцев)"
            value={form.employmentAndFinance.monthlyExpenses}
            onChange={(value) => updateEmployment("monthlyExpenses", value)}
          />
          <TextField
            label="30. Сколько Вам лично будет стоить Ваша поездка?"
            value={form.employmentAndFinance.tripPersonalCost}
            onChange={(value) => updateEmployment("tripPersonalCost", value)}
          />
          <SelectField
            label="31. Кто-то другой оплачивает полностью/часть Вашей поездки?"
            value={form.employmentAndFinance.hasTripSponsor}
            onChange={(value) => updateEmployment("hasTripSponsor", value as YesNo)}
            options={yesNoOptions}
          />
          {showTripSponsor ? (
            <>
              <SelectField
                label="32. Кто оплачивает ваши расходы по поездке?"
                value={form.employmentAndFinance.sponsorType}
                onChange={(value) =>
                  updateEmployment("sponsorType", value as EmploymentDetails["sponsorType"])
                }
                options={[
                  { value: "", label: "Выберите вариант" },
                  { value: "familyOrFriend", label: "A) Семья или друг" },
                  { value: "employer", label: "Б) Ваш работодатель" },
                  { value: "organization", label: "В) Другая компания или организация" },
                ]}
              />
              {form.employmentAndFinance.sponsorType === "familyOrFriend" ? (
                <>
                  <TextField
                    label="32.A Имя и фамилия того, кто оплачивает расходы"
                    value={form.employmentAndFinance.sponsorPersonFullName}
                    onChange={(value) => updateEmployment("sponsorPersonFullName", value)}
                  />
                  <TextAreaField
                    label="32.A Адрес проживания спонсора"
                    value={form.employmentAndFinance.sponsorPersonAddress}
                    onChange={(value) => updateEmployment("sponsorPersonAddress", value)}
                  />
                  <TextField
                    label="32.A Какая сумма оплачивается за вашу поездку?"
                    value={form.employmentAndFinance.sponsorPersonAmount}
                    onChange={(value) => updateEmployment("sponsorPersonAmount", value)}
                  />
                  <TextAreaField
                    label="32.A По какой причине оплачивается ваша поездка?"
                    value={form.employmentAndFinance.sponsorPersonReason}
                    onChange={(value) => updateEmployment("sponsorPersonReason", value)}
                  />
                </>
              ) : null}
              {form.employmentAndFinance.sponsorType === "employer" ? (
                <>
                  <TextField
                    label="32.Б Какую сумму оплачивает работодатель?"
                    value={form.employmentAndFinance.sponsorEmployerAmount}
                    onChange={(value) => updateEmployment("sponsorEmployerAmount", value)}
                  />
                  <TextAreaField
                    label="32.Б По какой причине оплачивается ваша поездка?"
                    value={form.employmentAndFinance.sponsorEmployerReason}
                    onChange={(value) => updateEmployment("sponsorEmployerReason", value)}
                  />
                </>
              ) : null}
              {form.employmentAndFinance.sponsorType === "organization" ? (
                <>
                  <TextField
                    label="32.В Название компании или организации"
                    value={form.employmentAndFinance.sponsorOrganizationName}
                    onChange={(value) => updateEmployment("sponsorOrganizationName", value)}
                  />
                  <TextAreaField
                    label="32.В Полный адрес компании"
                    value={form.employmentAndFinance.sponsorOrganizationAddress}
                    onChange={(value) => updateEmployment("sponsorOrganizationAddress", value)}
                  />
                  <TextField
                    label="32.В Какая сумма оплачивается за вашу поездку?"
                    value={form.employmentAndFinance.sponsorOrganizationAmount}
                    onChange={(value) => updateEmployment("sponsorOrganizationAmount", value)}
                  />
                  <TextAreaField
                    label="32.В По какой причине оплачивается ваша поездка?"
                    value={form.employmentAndFinance.sponsorOrganizationReason}
                    onChange={(value) => updateEmployment("sponsorOrganizationReason", value)}
                  />
                </>
              ) : null}
            </>
          ) : null}
        </Section>
        ) : null}

        {activeStepIndex === 3 ? (
        <Section title="Информация о поездке в Великобританию">
          <TextField
            label="33. Дата Вашего приезда в Великобританию"
            type="date"
            value={form.tripDetails.arrivalDateUk}
            onChange={(value) => updateTrip("arrivalDateUk", value)}
            required
          />
          <TextField
            label="34. Дата отъезда из Великобритании"
            type="date"
            value={form.tripDetails.departureDateUk}
            onChange={(value) => updateTrip("departureDateUk", value)}
            required
          />
          <TextAreaField
            label="35. Какова основная цель вашей поездки в Великобританию?"
            value={form.tripDetails.primaryPurpose}
            onChange={(value) => updateTrip("primaryPurpose", value)}
          />
          <SelectField
            label="36. Едете ли Вы с кем-то, кто не является Вашим супругом или иждивенцем?"
            value={form.tripDetails.travelWithNonDependent}
            onChange={(value) => updateTrip("travelWithNonDependent", value as YesNo)}
            options={yesNoOptions}
          />
          {showCompanion ? (
            <>
              <TextField
                label="37. Имя и фамилия туриста, который путешествует с Вами"
                value={form.tripDetails.companion.fullName}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    tripDetails: {
                      ...prev.tripDetails,
                      companion: {
                        ...prev.tripDetails.companion,
                        fullName: value,
                      },
                    },
                  }))
                }
              />
              <TextField
                label="38. Гражданство"
                value={form.tripDetails.companion.citizenship}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    tripDetails: {
                      ...prev.tripDetails,
                      companion: {
                        ...prev.tripDetails.companion,
                        citizenship: value,
                      },
                    },
                  }))
                }
              />
              <TextField
                label="39. Кем он Вам приходится?"
                value={form.tripDetails.companion.relationship}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    tripDetails: {
                      ...prev.tripDetails,
                      companion: {
                        ...prev.tripDetails.companion,
                        relationship: value,
                      },
                    },
                  }))
                }
              />
            </>
          ) : null}
          <SelectField
            label="40. Где Вы планируете остановиться в Великобритании?"
            value={form.tripDetails.accommodationType}
            onChange={(value) =>
              updateTrip("accommodationType", value as TripDetails["accommodationType"])
            }
            options={[
              { value: "", label: "Выберите вариант" },
              { value: "hotel", label: "1) Отель" },
              { value: "relative", label: "2) У родственника" },
              { value: "friend", label: "3) У друзей" },
            ]}
          />
          {form.tripDetails.accommodationType === "hotel" ? (
            <TextAreaField
              label="41.1 Название и полный адрес отеля"
              value={form.tripDetails.hotelNameAndAddress}
              onChange={(value) => updateTrip("hotelNameAndAddress", value)}
            />
          ) : null}
          {form.tripDetails.accommodationType === "relative" ? (
            <TextAreaField
              label="41.2 Имя и фамилия родственника, полный адрес"
              value={form.tripDetails.relativeNameAndAddress}
              onChange={(value) => updateTrip("relativeNameAndAddress", value)}
            />
          ) : null}
          {form.tripDetails.accommodationType === "friend" ? (
            <TextAreaField
              label="41.3 Имя и фамилия друга, полный адрес"
              value={form.tripDetails.friendNameAndAddress}
              onChange={(value) => updateTrip("friendNameAndAddress", value)}
            />
          ) : null}
          {showBusinessTrip ? (
            <>
              <TextField
                label="42. Название компании или организации, пригласившей Вас в Великобританию"
                value={form.tripDetails.businessTrip.invitingCompanyName}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    tripDetails: {
                      ...prev.tripDetails,
                      businessTrip: {
                        ...prev.tripDetails.businessTrip,
                        invitingCompanyName: value,
                      },
                    },
                  }))
                }
              />
              <TextField
                label="43. Кто Вас пригласил? (Имя и фамилия)"
                value={form.tripDetails.businessTrip.inviterFullName}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    tripDetails: {
                      ...prev.tripDetails,
                      businessTrip: {
                        ...prev.tripDetails.businessTrip,
                        inviterFullName: value,
                      },
                    },
                  }))
                }
              />
              <TextAreaField
                label="44. Чем занимается компания, пригласившая Вас?"
                value={form.tripDetails.businessTrip.invitingCompanyActivity}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    tripDetails: {
                      ...prev.tripDetails,
                      businessTrip: {
                        ...prev.tripDetails.businessTrip,
                        invitingCompanyActivity: value,
                      },
                    },
                  }))
                }
              />
              <TextAreaField
                label="45. Полный адрес компании в Великобритании"
                value={form.tripDetails.businessTrip.invitingCompanyAddressUk}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    tripDetails: {
                      ...prev.tripDetails,
                      businessTrip: {
                        ...prev.tripDetails.businessTrip,
                        invitingCompanyAddressUk: value,
                      },
                    },
                  }))
                }
              />
              <TextField
                label="46. Телефон компании"
                value={form.tripDetails.businessTrip.invitingCompanyPhone}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    tripDetails: {
                      ...prev.tripDetails,
                      businessTrip: {
                        ...prev.tripDetails.businessTrip,
                        invitingCompanyPhone: value,
                      },
                    },
                  }))
                }
              />
              <TextAreaField
                label="47. Опишите, что Вы планируете делать в своей деловой поездке"
                value={form.tripDetails.businessTrip.plannedBusinessActivities}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    tripDetails: {
                      ...prev.tripDetails,
                      businessTrip: {
                        ...prev.tripDetails.businessTrip,
                        plannedBusinessActivities: value,
                      },
                    },
                  }))
                }
              />
            </>
          ) : null}
        </Section>
        ) : null}

        {activeStepIndex === 4 ? (
        <Section title="Информация о членах семьи и родителях">
          {showSpouseFields ? (
            <>
              <TextField
                label="48. Фамилия и имя супруга/и"
                value={form.familyAndDependants.spouse.fullName}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    familyAndDependants: {
                      ...prev.familyAndDependants,
                      spouse: {
                        ...prev.familyAndDependants.spouse,
                        fullName: value,
                      },
                    },
                  }))
                }
              />
              <TextField
                label="49. Гражданство супруга/и"
                value={form.familyAndDependants.spouse.citizenship}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    familyAndDependants: {
                      ...prev.familyAndDependants,
                      spouse: {
                        ...prev.familyAndDependants.spouse,
                        citizenship: value,
                      },
                    },
                  }))
                }
              />
              <TextField
                label="50. Дата рождения супруга/и"
                type="date"
                value={form.familyAndDependants.spouse.birthDate}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    familyAndDependants: {
                      ...prev.familyAndDependants,
                      spouse: {
                        ...prev.familyAndDependants.spouse,
                        birthDate: value,
                      },
                    },
                  }))
                }
              />
              <TextField
                label="51. Номер заграничного паспорта супруга/и"
                value={form.familyAndDependants.spouse.passportNumber}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    familyAndDependants: {
                      ...prev.familyAndDependants,
                      spouse: {
                        ...prev.familyAndDependants.spouse,
                        passportNumber: value,
                      },
                    },
                  }))
                }
              />
              <SelectField
                label="52. Едет ли с Вами супруг/а в Великобританию?"
                value={form.familyAndDependants.spouse.travelsWithApplicant}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    familyAndDependants: {
                      ...prev.familyAndDependants,
                      spouse: {
                        ...prev.familyAndDependants.spouse,
                        travelsWithApplicant: value as YesNo,
                      },
                    },
                  }))
                }
                options={yesNoOptions}
              />
              <SelectField
                label="53. Проживает ли Ваш супруг/а с Вами?"
                value={form.familyAndDependants.spouse.livesWithApplicant}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    familyAndDependants: {
                      ...prev.familyAndDependants,
                      spouse: {
                        ...prev.familyAndDependants.spouse,
                        livesWithApplicant: value as YesNo,
                      },
                    },
                  }))
                }
                options={yesNoOptions}
              />
              {form.familyAndDependants.spouse.livesWithApplicant === "no" ? (
                <>
                  <TextAreaField
                    label="54. Полный адрес (с индексом) проживания супруга"
                    value={form.familyAndDependants.spouse.residentialAddress}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        familyAndDependants: {
                          ...prev.familyAndDependants,
                          spouse: {
                            ...prev.familyAndDependants.spouse,
                            residentialAddress: value,
                          },
                        },
                      }))
                    }
                  />
                  <TextField
                    label="55. Страна проживания супруга"
                    value={form.familyAndDependants.spouse.residentialCountry}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        familyAndDependants: {
                          ...prev.familyAndDependants,
                          spouse: {
                            ...prev.familyAndDependants.spouse,
                            residentialCountry: value,
                          },
                        },
                      }))
                    }
                  />
                </>
              ) : null}
            </>
          ) : null}

          <TextField
            label="56. Отец: Имя"
            value={form.familyAndDependants.father.firstName}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                familyAndDependants: {
                  ...prev.familyAndDependants,
                  father: {
                    ...prev.familyAndDependants.father,
                    firstName: value,
                  },
                },
              }))
            }
          />
          <TextField
            label="57. Отец: Фамилия"
            value={form.familyAndDependants.father.lastName}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                familyAndDependants: {
                  ...prev.familyAndDependants,
                  father: {
                    ...prev.familyAndDependants.father,
                    lastName: value,
                  },
                },
              }))
            }
          />
          <TextField
            label="58. Отец: Дата рождения"
            type="date"
            value={form.familyAndDependants.father.birthDate}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                familyAndDependants: {
                  ...prev.familyAndDependants,
                  father: {
                    ...prev.familyAndDependants.father,
                    birthDate: value,
                  },
                },
              }))
            }
          />
          <TextField
            label="59. Отец: Гражданство"
            value={form.familyAndDependants.father.citizenship}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                familyAndDependants: {
                  ...prev.familyAndDependants,
                  father: {
                    ...prev.familyAndDependants.father,
                    citizenship: value,
                  },
                },
              }))
            }
          />
          <SelectField
            label="60. Всегда ли ваш отец имел одно гражданство?"
            value={form.familyAndDependants.father.hadSingleCitizenship}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                familyAndDependants: {
                  ...prev.familyAndDependants,
                  father: {
                    ...prev.familyAndDependants.father,
                    hadSingleCitizenship: value as YesNo,
                  },
                },
              }))
            }
            options={yesNoOptions}
          />
          {form.familyAndDependants.father.hadSingleCitizenship === "no" ? (
            <TextField
              label="60.1 Гражданство отца на момент вашего рождения"
              value={form.familyAndDependants.father.citizenshipAtApplicantBirth}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  familyAndDependants: {
                    ...prev.familyAndDependants,
                    father: {
                      ...prev.familyAndDependants.father,
                      citizenshipAtApplicantBirth: value,
                    },
                  },
                }))
              }
            />
          ) : null}

          <TextField
            label="61. Мать: Имя"
            value={form.familyAndDependants.mother.firstName}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                familyAndDependants: {
                  ...prev.familyAndDependants,
                  mother: {
                    ...prev.familyAndDependants.mother,
                    firstName: value,
                  },
                },
              }))
            }
          />
          <TextField
            label="62. Мать: Фамилия"
            value={form.familyAndDependants.mother.lastName}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                familyAndDependants: {
                  ...prev.familyAndDependants,
                  mother: {
                    ...prev.familyAndDependants.mother,
                    lastName: value,
                  },
                },
              }))
            }
          />
          <TextField
            label="63. Мать: Дата рождения"
            type="date"
            value={form.familyAndDependants.mother.birthDate}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                familyAndDependants: {
                  ...prev.familyAndDependants,
                  mother: {
                    ...prev.familyAndDependants.mother,
                    birthDate: value,
                  },
                },
              }))
            }
          />
          <TextField
            label="64. Мать: Гражданство"
            value={form.familyAndDependants.mother.citizenship}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                familyAndDependants: {
                  ...prev.familyAndDependants,
                  mother: {
                    ...prev.familyAndDependants.mother,
                    citizenship: value,
                  },
                },
              }))
            }
          />
          <SelectField
            label="65. Всегда ли ваша мать имела одно гражданство?"
            value={form.familyAndDependants.mother.hadSingleCitizenship}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                familyAndDependants: {
                  ...prev.familyAndDependants,
                  mother: {
                    ...prev.familyAndDependants.mother,
                    hadSingleCitizenship: value as YesNo,
                  },
                },
              }))
            }
            options={yesNoOptions}
          />
          {form.familyAndDependants.mother.hadSingleCitizenship === "no" ? (
            <TextField
              label="65.1 Гражданство матери на момент вашего рождения"
              value={form.familyAndDependants.mother.citizenshipAtApplicantBirth}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  familyAndDependants: {
                    ...prev.familyAndDependants,
                    mother: {
                      ...prev.familyAndDependants.mother,
                      citizenshipAtApplicantBirth: value,
                    },
                  },
                }))
              }
            />
          ) : null}

          <SelectField
            label="66. Нуждается ли кто-то в Вашей финансовой поддержке?"
            value={form.familyAndDependants.childDependant.hasDependants}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                familyAndDependants: {
                  ...prev.familyAndDependants,
                  childDependant: {
                    ...prev.familyAndDependants.childDependant,
                    hasDependants: value as YesNo,
                  },
                },
              }))
            }
            options={yesNoOptions}
          />
          {showChildFields ? (
            <>
              <TextField
                label="67. Фамилия и имя ребенка"
                value={form.familyAndDependants.childDependant.childFullName}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    familyAndDependants: {
                      ...prev.familyAndDependants,
                      childDependant: {
                        ...prev.familyAndDependants.childDependant,
                        childFullName: value,
                      },
                    },
                  }))
                }
              />
              <TextField
                label="68. Дата рождения ребенка"
                type="date"
                value={form.familyAndDependants.childDependant.childBirthDate}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    familyAndDependants: {
                      ...prev.familyAndDependants,
                      childDependant: {
                        ...prev.familyAndDependants.childDependant,
                        childBirthDate: value,
                      },
                    },
                  }))
                }
              />
              <TextField
                label="69. Место рождения ребенка"
                value={form.familyAndDependants.childDependant.childBirthPlace}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    familyAndDependants: {
                      ...prev.familyAndDependants,
                      childDependant: {
                        ...prev.familyAndDependants.childDependant,
                        childBirthPlace: value,
                      },
                    },
                  }))
                }
              />
              <TextField
                label="70. Гражданство ребенка"
                value={form.familyAndDependants.childDependant.childCitizenship}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    familyAndDependants: {
                      ...prev.familyAndDependants,
                      childDependant: {
                        ...prev.familyAndDependants.childDependant,
                        childCitizenship: value,
                      },
                    },
                  }))
                }
              />
              <TextField
                label="71. Номер загранпаспорта ребенка"
                value={form.familyAndDependants.childDependant.childPassportNumber}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    familyAndDependants: {
                      ...prev.familyAndDependants,
                      childDependant: {
                        ...prev.familyAndDependants.childDependant,
                        childPassportNumber: value,
                      },
                    },
                  }))
                }
              />
              <SelectField
                label="72. Ребенок едет с Вами?"
                value={form.familyAndDependants.childDependant.childTravelsWithApplicant}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    familyAndDependants: {
                      ...prev.familyAndDependants,
                      childDependant: {
                        ...prev.familyAndDependants.childDependant,
                        childTravelsWithApplicant: value as YesNo,
                      },
                    },
                  }))
                }
                options={yesNoOptions}
              />
              <SelectField
                label="73. Ребенок проживает с Вами?"
                value={form.familyAndDependants.childDependant.childLivesWithApplicant}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    familyAndDependants: {
                      ...prev.familyAndDependants,
                      childDependant: {
                        ...prev.familyAndDependants.childDependant,
                        childLivesWithApplicant: value as YesNo,
                      },
                    },
                  }))
                }
                options={yesNoOptions}
              />
              {showChildAddress ? (
                <TextAreaField
                  label="74. Полный фактический адрес проживания ребенка"
                  value={form.familyAndDependants.childDependant.childResidentialAddress}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      familyAndDependants: {
                        ...prev.familyAndDependants,
                        childDependant: {
                          ...prev.familyAndDependants.childDependant,
                          childResidentialAddress: value,
                        },
                      },
                    }))
                  }
                />
              ) : null}
            </>
          ) : null}
          <SelectField
            label="75. Есть ли у Вас родственники, которые проживают в Великобритании?"
            value={form.familyAndDependants.hasUkRelatives}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                familyAndDependants: {
                  ...prev.familyAndDependants,
                  hasUkRelatives: value as YesNo,
                },
              }))
            }
            options={yesNoOptions}
          />
          {showUkRelatives ? (
            <>
              <TextField
                label="76. Кем Вам приходится родственник/и?"
                value={form.familyAndDependants.ukRelativesRelationship}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    familyAndDependants: {
                      ...prev.familyAndDependants,
                      ukRelativesRelationship: value,
                    },
                  }))
                }
              />
              {form.familyAndDependants.ukRelatives.map((relative, index) => (
                <div key={`uk-relative-${index}`} className="nested-block">
                  <h3>Родственник в Великобритании #{index + 1}</h3>
                  <TextField
                    label={`77.${index + 1} Имя и фамилия родственника`}
                    value={relative.fullName}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        familyAndDependants: {
                          ...prev.familyAndDependants,
                          ukRelatives: prev.familyAndDependants.ukRelatives.map(
                            (item, itemIndex) =>
                              itemIndex === index ? { ...item, fullName: value } : item,
                          ) as typeof prev.familyAndDependants.ukRelatives,
                        },
                      }))
                    }
                  />
                  <TextField
                    label={`78.${index + 1} Гражданство родственника`}
                    value={relative.citizenship}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        familyAndDependants: {
                          ...prev.familyAndDependants,
                          ukRelatives: prev.familyAndDependants.ukRelatives.map(
                            (item, itemIndex) =>
                              itemIndex === index ? { ...item, citizenship: value } : item,
                          ) as typeof prev.familyAndDependants.ukRelatives,
                        },
                      }))
                    }
                  />
                  <SelectField
                    label={`79.${index + 1} На каком основании находится в Великобритании?`}
                    value={relative.ukStayBasis}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        familyAndDependants: {
                          ...prev.familyAndDependants,
                          ukRelatives: prev.familyAndDependants.ukRelatives.map(
                            (item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    ukStayBasis:
                                      value as (typeof relative)["ukStayBasis"],
                                  }
                                : item,
                          ) as typeof prev.familyAndDependants.ukRelatives,
                        },
                      }))
                    }
                    options={[
                      { value: "", label: "Выберите вариант" },
                      { value: "temporaryVisa", label: "Имеет временную визу" },
                      { value: "permanentResidence", label: "Проживает постоянно" },
                    ]}
                  />
                  <TextField
                    label={`80.${index + 1} Номер паспорта и Residence Permit`}
                    value={relative.passportOrResidencePermitNumber}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        familyAndDependants: {
                          ...prev.familyAndDependants,
                          ukRelatives: prev.familyAndDependants.ukRelatives.map(
                            (item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, passportOrResidencePermitNumber: value }
                                : item,
                          ) as typeof prev.familyAndDependants.ukRelatives,
                        },
                      }))
                    }
                  />
                </div>
              ))}
            </>
          ) : null}
        </Section>
        ) : null}

        {activeStepIndex === 5 ? (
        <Section title="Информация о поездках">
          <SelectField
            label="81. Получали ли Вы визу в Великобританию?"
            value={form.travelHistory.hadUkVisaBefore}
            onChange={(value) => updateTravelHistory("hadUkVisaBefore", value as YesNo)}
            options={yesNoOptions}
          />
          {showUkVisaMonthYear ? (
            <TextField
              label="81.1 Месяц и год открытия визы в UK"
              type="month"
              value={form.travelHistory.ukVisaIssuedMonthYear}
              onChange={(value) => updateTravelHistory("ukVisaIssuedMonthYear", value)}
            />
          ) : null}
          <SelectField
            label="82. Сколько раз Вы были в Великобритании за последние 10 лет?"
            value={form.travelHistory.ukVisitsLast10Years}
            onChange={(value) =>
              updateTravelHistory(
                "ukVisitsLast10Years",
                value as TravelHistoryDetails["ukVisitsLast10Years"],
              )
            }
            options={[
              { value: "", label: "Выберите вариант" },
              { value: "none", label: "Ни разу" },
              { value: "once", label: "Один раз" },
              { value: "2to5", label: "От 2 до 5 раз" },
              { value: "6plus", label: "Более 6 раз" },
            ]}
          />
          {showUkTrips
            ? form.travelHistory.ukTripHistory.slice(0, visibleUkTrips).map((trip, index) => (
                <div key={`uk-trip-${index}`} className="nested-block">
                  <h3>83. Поездка в UK #{index + 1}</h3>
                  <TextField
                    label="83. Цель поездки"
                    value={trip.purpose}
                    onChange={(value) =>
                      updateTripArray("ukTripHistory", index, "purpose", value)
                    }
                  />
                  <TextField
                    label="83. Дата въезда в Великобританию"
                    type="date"
                    value={trip.entryDate}
                    onChange={(value) =>
                      updateTripArray("ukTripHistory", index, "entryDate", value)
                    }
                  />
                  <TextField
                    label="83. Дата выезда из Великобритании"
                    type="date"
                    value={trip.exitDate}
                    onChange={(value) =>
                      updateTripArray("ukTripHistory", index, "exitDate", value)
                    }
                  />
                  <TextField
                    label="83. Количество дней пребывания"
                    value={trip.daysStayed}
                    onChange={(value) =>
                      updateTripArray("ukTripHistory", index, "daysStayed", value)
                    }
                  />
                </div>
              ))
            : null}
          {showUkTrips && visibleUkTrips < MAX_UK_TRIPS ? (
            <button
              type="button"
              onClick={() =>
                revealNextTrip(
                  "ukTripHistory",
                  MAX_UK_TRIPS,
                  visibleUkTrips,
                  setVisibleUkTrips,
                )
              }
            >
              Добавить еще поездку в UK
            </button>
          ) : null}
          <SelectField
            label="84. Было ли Вам когда-либо отказано в визе в UK?"
            value={form.travelHistory.hadUkVisaRefusal}
            onChange={(value) => updateTravelHistory("hadUkVisaRefusal", value as YesNo)}
            options={yesNoOptions}
          />
          <SelectField
            label="84. Было ли Вам когда-либо отказано во въезде в UK?"
            value={form.travelHistory.hadUkEntryRefusal}
            onChange={(value) => updateTravelHistory("hadUkEntryRefusal", value as YesNo)}
            options={yesNoOptions}
          />
          <SelectField
            label="84. Были ли Вы депортированы из UK?"
            value={form.travelHistory.hadUkDeportation}
            onChange={(value) => updateTravelHistory("hadUkDeportation", value as YesNo)}
            options={yesNoOptions}
          />
          {showUkRefusalDetails ? (
            <>
              <TextField
                label="84.1 Дата получения отказа / дата депортации"
                type="date"
                value={form.travelHistory.ukRefusalOrDeportationDate}
                onChange={(value) => updateTravelHistory("ukRefusalOrDeportationDate", value)}
              />
              <TextAreaField
                label="84.1 Причина отказа во въезде/визе или депортации"
                value={form.travelHistory.ukRefusalOrDeportationReason}
                onChange={(value) => updateTravelHistory("ukRefusalOrDeportationReason", value)}
              />
            </>
          ) : null}
          <SelectField
            label="85. Было ли Вам когда-либо отказано в визе в другую страну?"
            value={form.travelHistory.hadOtherVisaRefusal}
            onChange={(value) => updateTravelHistory("hadOtherVisaRefusal", value as YesNo)}
            options={yesNoOptions}
          />
          <SelectField
            label="85. Было ли Вам когда-либо отказано во въезде в другую страну?"
            value={form.travelHistory.hadOtherEntryRefusal}
            onChange={(value) => updateTravelHistory("hadOtherEntryRefusal", value as YesNo)}
            options={yesNoOptions}
          />
          <SelectField
            label="85. Были ли Вы депортированы из другой страны?"
            value={form.travelHistory.hadOtherDeportation}
            onChange={(value) => updateTravelHistory("hadOtherDeportation", value as YesNo)}
            options={yesNoOptions}
          />
          {showOtherRefusalDetails ? (
            <>
              <TextField
                label="85.1 Название страны (кроме UK)"
                value={form.travelHistory.otherRefusalCountry}
                onChange={(value) => updateTravelHistory("otherRefusalCountry", value)}
              />
              <TextField
                label="85.1 Дата получения отказа / депортации (кроме UK)"
                type="date"
                value={form.travelHistory.otherRefusalOrDeportationDate}
                onChange={(value) =>
                  updateTravelHistory("otherRefusalOrDeportationDate", value)
                }
              />
              <TextAreaField
                label="85.1 Причина отказа во въезде/визе или депортации"
                value={form.travelHistory.otherRefusalOrDeportationReason}
                onChange={(value) =>
                  updateTravelHistory("otherRefusalOrDeportationReason", value)
                }
              />
            </>
          ) : null}
          <SelectField
            label="86. Вы выезжали за границу за последние 10 лет (за исключением UK)?"
            value={form.travelHistory.traveledAbroadLast10YearsExcludingUk}
            onChange={(value) =>
              updateTravelHistory("traveledAbroadLast10YearsExcludingUk", value as YesNo)
            }
            options={yesNoOptions}
          />
          {showAbroadTrips ? (
            <>
              {form.travelHistory.majorCountryTrips.slice(0, visibleMajorTrips).map((trip, index) => (
                <div key={`major-trip-${index}`} className="nested-block">
                  <h3>87. Поездка в США/Канаду/Австралию/Новую Зеландию/ЕЭЗ #{index + 1}</h3>
                  <TextField
                    label="87. Страна"
                    value={trip.country}
                    onChange={(value) =>
                      updateTripArray("majorCountryTrips", index, "country", value)
                    }
                  />
                  <TextField
                    label="87. Цель поездки"
                    value={trip.purpose}
                    onChange={(value) =>
                      updateTripArray("majorCountryTrips", index, "purpose", value)
                    }
                  />
                  <TextField
                    label="87. Дата въезда"
                    type="date"
                    value={trip.entryDate}
                    onChange={(value) =>
                      updateTripArray("majorCountryTrips", index, "entryDate", value)
                    }
                  />
                  <TextField
                    label="87. Дата выезда"
                    type="date"
                    value={trip.exitDate}
                    onChange={(value) =>
                      updateTripArray("majorCountryTrips", index, "exitDate", value)
                    }
                  />
                  <TextField
                    label="87. Количество дней"
                    value={trip.daysStayed}
                    onChange={(value) =>
                      updateTripArray("majorCountryTrips", index, "daysStayed", value)
                    }
                  />
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => removeTripForm("majorCountryTrips", index, setVisibleMajorTrips)}
                  >
                    Удалить эту поездку
                  </button>
                </div>
              ))}
              {visibleMajorTrips < MAX_MAJOR_TRIPS ? (
                <button
                  type="button"
                  onClick={() =>
                    revealNextTrip(
                      "majorCountryTrips",
                      MAX_MAJOR_TRIPS,
                      visibleMajorTrips,
                      setVisibleMajorTrips,
                    )
                  }
                >
                  Добавить еще поездку в США/Канаду/Австралию/Новую Зеландию/ЕЭЗ
                </button>
              ) : null}
              {form.travelHistory.otherCountryTrips.slice(0, visibleOtherTrips).map((trip, index) => (
                <div key={`other-trip-${index}`} className="nested-block">
                  <h3>87. Поездка в другие страны #{index + 1}</h3>
                  <TextField
                    label="87. Страна"
                    value={trip.country}
                    onChange={(value) =>
                      updateTripArray("otherCountryTrips", index, "country", value)
                    }
                  />
                  <TextField
                    label="87. Цель поездки"
                    value={trip.purpose}
                    onChange={(value) =>
                      updateTripArray("otherCountryTrips", index, "purpose", value)
                    }
                  />
                  <TextField
                    label="87. Дата въезда"
                    type="date"
                    value={trip.entryDate}
                    onChange={(value) =>
                      updateTripArray("otherCountryTrips", index, "entryDate", value)
                    }
                  />
                  <TextField
                    label="87. Дата выезда"
                    type="date"
                    value={trip.exitDate}
                    onChange={(value) =>
                      updateTripArray("otherCountryTrips", index, "exitDate", value)
                    }
                  />
                  <TextField
                    label="87. Количество дней"
                    value={trip.daysStayed}
                    onChange={(value) =>
                      updateTripArray("otherCountryTrips", index, "daysStayed", value)
                    }
                  />
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => removeTripForm("otherCountryTrips", index, setVisibleOtherTrips)}
                  >
                    Удалить эту поездку
                  </button>
                </div>
              ))}
              {visibleOtherTrips < MAX_OTHER_TRIPS ? (
                <button
                  type="button"
                  onClick={() =>
                    revealNextTrip(
                      "otherCountryTrips",
                      MAX_OTHER_TRIPS,
                      visibleOtherTrips,
                      setVisibleOtherTrips,
                    )
                  }
                >
                  Добавить еще поездку в другие страны
                </button>
              ) : null}
            </>
          ) : null}
        </Section>
        ) : null}

        {activeStepIndex === 6 ? (
        <Section title="Судимость и другие виды наказаний">
          <SelectField
            label="88.1 Судимость за совершение уголовного преступления"
            value={form.securityAndBackground.convictedCriminalOffence}
            onChange={(value) => updateSecurity("convictedCriminalOffence", value as YesNo)}
            options={yesNoOptions}
          />
          <SelectField
            label="88.2 Наказание за нарушение ПДД (скорость, страховка и т.д.)"
            value={form.securityAndBackground.trafficOffencePenalty}
            onChange={(value) => updateSecurity("trafficOffencePenalty", value as YesNo)}
            options={yesNoOptions}
          />
          <SelectField
            label="88.3 Обвинение или арест по делам на рассмотрении суда"
            value={form.securityAndBackground.chargedOrAwaitingTrial}
            onChange={(value) => updateSecurity("chargedOrAwaitingTrial", value as YesNo)}
            options={yesNoOptions}
          />
          <SelectField
            label="88.4 Предостережение, предупреждение, выговор и другие наказания"
            value={form.securityAndBackground.warningOrOtherPenalty}
            onChange={(value) => updateSecurity("warningOrOtherPenalty", value as YesNo)}
            options={yesNoOptions}
          />
          <SelectField
            label="88.5 Решение суда против Вас (долги, банкротство, асоциальное поведение)"
            value={form.securityAndBackground.civilJudgementOrBankruptcy}
            onChange={(value) =>
              updateSecurity("civilJudgementOrBankruptcy", value as YesNo)
            }
            options={yesNoOptions}
          />
          {showCriminalDetails ? (
            <TextAreaField
              label="88.6 Если Да, укажите подробности"
              value={form.securityAndBackground.criminalDetails}
              onChange={(value) => updateSecurity("criminalDetails", value)}
            />
          ) : null}
          <SelectField
            label="89. Были ли Вы вовлечены в военные преступления, преступления против человечества или геноцид?"
            value={form.securityAndBackground.involvedInWarCrimesOrGenocide}
            onChange={(value) =>
              updateSecurity("involvedInWarCrimesOrGenocide", value as YesNo)
            }
            options={yesNoOptions}
          />
          <SelectField
            label="90. Являлись ли Вы членом организации, связанной с террористической деятельностью?"
            value={form.securityAndBackground.involvedWithTerroristOrganization}
            onChange={(value) =>
              updateSecurity("involvedWithTerroristOrganization", value as YesNo)
            }
            options={yesNoOptions}
          />
          <SelectField
            label="91. Высказывали ли Вы взгляды, оправдывающие или восхваляющие терроризм?"
            value={form.securityAndBackground.expressedTerrorismSupportViews}
            onChange={(value) =>
              updateSecurity("expressedTerrorismSupportViews", value as YesNo)
            }
            options={yesNoOptions}
          />
          {showSecurityDetails ? (
            <TextAreaField
              label="92. Если Да, укажите подробности"
              value={form.securityAndBackground.securityDetails}
              onChange={(value) => updateSecurity("securityDetails", value)}
            />
          ) : null}
          <SelectField
            label="93. Вы когда-либо работали в перечисленных организациях?"
            value={form.securityAndBackground.workedInListedOrganizations}
            onChange={(value) => updateSecurity("workedInListedOrganizations", value as YesNo)}
            options={yesNoOptions}
          />
          {showListedOrganizations ? (
            <>
              <TextAreaField
                label="93.1 Вооружённые силы (период службы и род войск)"
                value={form.securityAndBackground.armedForcesInfo}
                onChange={(value) => updateSecurity("armedForcesInfo", value)}
              />
              <TextAreaField
                label="93.2 Правительственные органы (название, должность, период)"
                value={form.securityAndBackground.governmentRoleInfo}
                onChange={(value) => updateSecurity("governmentRoleInfo", value)}
              />
              <TextAreaField
                label="93.3 Средства массовой информации (название, должность, период)"
                value={form.securityAndBackground.mediaRoleInfo}
                onChange={(value) => updateSecurity("mediaRoleInfo", value)}
              />
              <TextAreaField
                label="93.4 Структуры безопасности (название, должность, период)"
                value={form.securityAndBackground.securityRoleInfo}
                onChange={(value) => updateSecurity("securityRoleInfo", value)}
              />
              <TextAreaField
                label="93.5 Административные организации (даты, должность, название)"
                value={form.securityAndBackground.administrativeRoleInfo}
                onChange={(value) => updateSecurity("administrativeRoleInfo", value)}
              />
              <TextAreaField
                label="93.6 Судебные органы (название, должность, период)"
                value={form.securityAndBackground.judicialRoleInfo}
                onChange={(value) => updateSecurity("judicialRoleInfo", value)}
              />
            </>
          ) : null}
          <TextAreaField
            label="94. Есть какая-либо дополнительная информация, которую Вы хотите сообщить?"
            value={form.securityAndBackground.additionalInformation}
            onChange={(value) => updateSecurity("additionalInformation", value)}
          />
          <SelectField
            label="95. В каком Британском визовом центре Вы будете сдавать биометрические данные?"
            value={form.securityAndBackground.biometricSubmissionCity}
            onChange={(value) =>
              updateSecurity(
                "biometricSubmissionCity",
                value as SecurityAndBackgroundDetails["biometricSubmissionCity"],
              )
            }
            options={[
              { value: "", label: "Выберите город" },
              { value: "moscow", label: "Москва" },
              { value: "saintPetersburg", label: "Санкт-Петербург" },
              { value: "rostovOnDon", label: "Ростов-на-Дону" },
              { value: "yekaterinburg", label: "Екатеринбург" },
              { value: "novosibirsk", label: "Новосибирск" },
            ]}
          />
        </Section>
        ) : null}

        <div className="form-wizard-footer">
          <div className="form-wizard-footer-buttons">
            <button
              type="button"
              className="button-secondary"
              onClick={goBack}
              disabled={activeStepIndex === 0 || isSubmitting}
            >
              Назад
            </button>
            {!isLastStep ? (
              <button type="button" onClick={goNext} disabled={isSubmitting}>
                Далее
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Отправка..." : "Отправить"}
              </button>
            )}
          </div>
        </div>
      </form>
    </main>
  );
}
