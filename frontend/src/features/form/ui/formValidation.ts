import type { SubmitFormRequest, TripRecord } from "../model/types";

export const isBusinessPurpose = (purpose: string): boolean => {
  const value = purpose.trim().toLowerCase();
  return value.includes("дел") || value.includes("business");
};

export const hasAnyTripData = (records: TripRecord[]): boolean =>
  records.some(
    (record) =>
      record.purpose.trim() !== "" ||
      record.entryDate.trim() !== "" ||
      record.exitDate.trim() !== "" ||
      record.daysStayed.trim() !== "" ||
      record.country.trim() !== "",
  );

export function validatePersonalStep(form: SubmitFormRequest): string | null {
  if (!form.personalDetails.fullNamePassport.trim()) {
    return "Заполните п. 1 (ФИО).";
  }
  if (!form.personalDetails.residentialAddress.trim()) {
    return "Заполните п. 3 (фактический адрес).";
  }
  if (!form.personalDetails.mobilePhone.trim()) {
    return "Заполните п. 5 (мобильный телефон).";
  }
  if (!form.personalDetails.email.trim()) {
    return "Заполните п. 5.1 (email).";
  }
  if (!form.personalDetails.housingStatus) {
    return "Выберите п. 6 (статус жилья).";
  }
  if (form.personalDetails.housingStatus === "other" && !form.personalDetails.housingStatusDetails.trim()) {
    return "Заполните п. 6.1 (другое по жилью).";
  }
  if (!form.personalDetails.maritalStatus) {
    return "Выберите п. 7 (семейное положение).";
  }
  if (!form.personalDetails.citizenship.trim()) {
    return "Заполните п. 8 (гражданство).";
  }
  if (!form.personalDetails.birthDate.trim() || !form.personalDetails.birthCountry.trim()) {
    return "Заполните п. 9-10 (дата и страна рождения).";
  }
  return null;
}

export function validatePassportStep(form: SubmitFormRequest): string | null {
  if (!form.passportDetails.currentPassportNumber.trim() || !form.passportDetails.currentPassportIssuingAuthority.trim()) {
    return "Заполните п. 12-13 (паспортные данные).";
  }
  if (!form.passportDetails.currentPassportValidTo.trim()) {
    return "Заполните п. 14 (срок действия загранпаспорта).";
  }
  if (!form.passportDetails.hasOtherPassport) {
    return "Выберите п. 15 (другой загранпаспорт).";
  }
  if (form.passportDetails.hasOtherPassport === "yes") {
    if (
      !form.passportDetails.otherPassportNumber.trim() ||
      !form.passportDetails.otherPassportIssuingAuthority.trim() ||
      !form.passportDetails.otherPassportIssueDate.trim() ||
      !form.passportDetails.otherPassportExpiryDate.trim()
    ) {
      return "Заполните п. 16 (данные второго паспорта).";
    }
  }
  return null;
}

export function validateEmploymentStep(form: SubmitFormRequest): string | null {
  if (form.employmentAndFinance.employmentStatuses.length === 0) {
    return "Выберите хотя бы один вариант в п. 18.";
  }
  if (!form.employmentAndFinance.hasOtherIncome) {
    return "Выберите п. 26 (доход из других источников).";
  }
  if (form.employmentAndFinance.hasOtherIncome === "yes") {
    if (form.employmentAndFinance.otherIncomeSources.length === 0 || !form.employmentAndFinance.otherIncomeTotalYear.trim()) {
      return "Заполните п. 37.1 (источники и сумма дохода).";
    }
  }
  if (!form.employmentAndFinance.hasSavings) {
    return "Выберите п. 27 (сбережения).";
  }
  if (form.employmentAndFinance.hasSavings === "yes" && !form.employmentAndFinance.savingsBalance.trim()) {
    return "Заполните п. 28 (остаток по справке).";
  }
  if (!form.employmentAndFinance.hasTripSponsor) {
    return "Выберите п. 31 (есть ли спонсор поездки).";
  }
  if (form.employmentAndFinance.hasTripSponsor === "yes") {
    if (!form.employmentAndFinance.sponsorType) {
      return "Выберите п. 32 (кто оплачивает поездку).";
    }
  }
  return null;
}

export function validateTripStep(form: SubmitFormRequest): string | null {
  if (!form.tripDetails.arrivalDateUk.trim() || !form.tripDetails.departureDateUk.trim() || !form.tripDetails.primaryPurpose.trim()) {
    return "Заполните п. 33-35 (даты и цель поездки).";
  }
  if (!form.tripDetails.travelWithNonDependent) {
    return "Выберите п. 36 (путешествие с кем-то).";
  }
  if (form.tripDetails.travelWithNonDependent === "yes") {
    if (
      !form.tripDetails.companion.fullName.trim() ||
      !form.tripDetails.companion.citizenship.trim() ||
      !form.tripDetails.companion.relationship.trim()
    ) {
      return "Заполните п. 37-39 (данные сопровождающего).";
    }
  }
  if (!form.tripDetails.accommodationType) {
    return "Выберите п. 40 (место проживания в UK).";
  }
  if (form.tripDetails.accommodationType === "hotel" && !form.tripDetails.hotelNameAndAddress.trim()) {
    return "Заполните п. 41.1 (данные отеля).";
  }
  if (form.tripDetails.accommodationType === "relative" && !form.tripDetails.relativeNameAndAddress.trim()) {
    return "Заполните п. 41.2 (данные родственника).";
  }
  if (form.tripDetails.accommodationType === "friend" && !form.tripDetails.friendNameAndAddress.trim()) {
    return "Заполните п. 41.3 (данные друга).";
  }

  const businessTripRequired = isBusinessPurpose(form.tripDetails.primaryPurpose);
  if (businessTripRequired) {
    if (
      !form.tripDetails.businessTrip.invitingCompanyName.trim() ||
      !form.tripDetails.businessTrip.inviterFullName.trim() ||
      !form.tripDetails.businessTrip.invitingCompanyActivity.trim() ||
      !form.tripDetails.businessTrip.invitingCompanyAddressUk.trim() ||
      !form.tripDetails.businessTrip.invitingCompanyPhone.trim() ||
      !form.tripDetails.businessTrip.plannedBusinessActivities.trim()
    ) {
      return "Для деловой цели заполните п. 42-47.";
    }
  }

  return null;
}

export function validateFamilyStep(form: SubmitFormRequest): string | null {
  const spouseRequired = form.personalDetails.maritalStatus === "married";
  if (spouseRequired) {
    if (
      !form.familyAndDependants.spouse.fullName.trim() ||
      !form.familyAndDependants.spouse.citizenship.trim() ||
      !form.familyAndDependants.spouse.birthDate.trim() ||
      !form.familyAndDependants.spouse.passportNumber.trim()
    ) {
      return "Заполните п. 48-51 (данные супруга/и).";
    }
    if (!form.familyAndDependants.spouse.travelsWithApplicant || !form.familyAndDependants.spouse.livesWithApplicant) {
      return "Заполните п. 52-53 (статус супруга/и).";
    }
    if (
      form.familyAndDependants.spouse.livesWithApplicant === "no" &&
      (!form.familyAndDependants.spouse.residentialAddress.trim() || !form.familyAndDependants.spouse.residentialCountry.trim())
    ) {
      return "Заполните п. 54-55 (адрес супруга/и).";
    }
  }

  if (!form.familyAndDependants.childDependant.hasDependants) {
    return "Выберите п. 66 (наличие иждивенцев).";
  }
  if (form.familyAndDependants.childDependant.hasDependants === "yes") {
    if (
      !form.familyAndDependants.childDependant.childFullName.trim() ||
      !form.familyAndDependants.childDependant.childBirthDate.trim() ||
      !form.familyAndDependants.childDependant.childBirthPlace.trim() ||
      !form.familyAndDependants.childDependant.childCitizenship.trim() ||
      !form.familyAndDependants.childDependant.childPassportNumber.trim()
    ) {
      return "Заполните п. 67-71 (данные ребенка).";
    }
    if (
      form.familyAndDependants.childDependant.childLivesWithApplicant === "no" &&
      !form.familyAndDependants.childDependant.childResidentialAddress.trim()
    ) {
      return "Заполните п. 74 (адрес проживания ребенка).";
    }
  }

  if (!form.familyAndDependants.hasUkRelatives) {
    return "Выберите п. 75 (родственники в UK).";
  }
  if (form.familyAndDependants.hasUkRelatives === "yes") {
    if (!form.familyAndDependants.ukRelativesRelationship.trim()) {
      return "Заполните п. 76 (степень родства).";
    }
  }

  return null;
}

export function validateTravelHistoryStep(form: SubmitFormRequest): string | null {
  if (!form.travelHistory.hadUkVisaBefore) {
    return "Выберите п. 81 (виза в UK ранее).";
  }
  if (form.travelHistory.hadUkVisaBefore === "yes" && !form.travelHistory.ukVisaIssuedMonthYear.trim()) {
    return "Заполните п. 81.1 (месяц и год открытия визы).";
  }
  if (!form.travelHistory.ukVisitsLast10Years) {
    return "Выберите п. 82 (количество поездок в UK).";
  }
  if (form.travelHistory.ukVisitsLast10Years !== "none" && !hasAnyTripData(form.travelHistory.ukTripHistory)) {
    return "Заполните п. 83 (информация о поездках в UK).";
  }
  if (
    form.travelHistory.hadUkVisaRefusal === "yes" ||
    form.travelHistory.hadUkEntryRefusal === "yes" ||
    form.travelHistory.hadUkDeportation === "yes"
  ) {
    if (!form.travelHistory.ukRefusalOrDeportationDate.trim() || !form.travelHistory.ukRefusalOrDeportationReason.trim()) {
      return "Заполните п. 84.1.";
    }
  }
  if (
    form.travelHistory.hadOtherVisaRefusal === "yes" ||
    form.travelHistory.hadOtherEntryRefusal === "yes" ||
    form.travelHistory.hadOtherDeportation === "yes"
  ) {
    if (
      !form.travelHistory.otherRefusalCountry.trim() ||
      !form.travelHistory.otherRefusalOrDeportationDate.trim() ||
      !form.travelHistory.otherRefusalOrDeportationReason.trim()
    ) {
      return "Заполните п. 85.1.";
    }
  }

  if (!form.travelHistory.traveledAbroadLast10YearsExcludingUk) {
    return "Выберите п. 86 (поездки за границу).";
  }
  if (
    form.travelHistory.traveledAbroadLast10YearsExcludingUk === "yes" &&
    !hasAnyTripData(form.travelHistory.majorCountryTrips) &&
    !hasAnyTripData(form.travelHistory.otherCountryTrips)
  ) {
    return "Заполните п. 87 (таблица поездок).";
  }

  return null;
}

export function validateSecurityStep(form: SubmitFormRequest): string | null {
  if (
    form.securityAndBackground.convictedCriminalOffence === "yes" ||
    form.securityAndBackground.trafficOffencePenalty === "yes" ||
    form.securityAndBackground.chargedOrAwaitingTrial === "yes" ||
    form.securityAndBackground.warningOrOtherPenalty === "yes" ||
    form.securityAndBackground.civilJudgementOrBankruptcy === "yes"
  ) {
    if (!form.securityAndBackground.criminalDetails.trim()) {
      return "Заполните п. 88.6.";
    }
  }

  if (
    form.securityAndBackground.involvedInWarCrimesOrGenocide === "yes" ||
    form.securityAndBackground.involvedWithTerroristOrganization === "yes" ||
    form.securityAndBackground.expressedTerrorismSupportViews === "yes"
  ) {
    if (!form.securityAndBackground.securityDetails.trim()) {
      return "Заполните п. 92.";
    }
  }

  if (form.securityAndBackground.workedInListedOrganizations === "yes") {
    if (
      !form.securityAndBackground.armedForcesInfo.trim() &&
      !form.securityAndBackground.governmentRoleInfo.trim() &&
      !form.securityAndBackground.mediaRoleInfo.trim() &&
      !form.securityAndBackground.securityRoleInfo.trim() &&
      !form.securityAndBackground.administrativeRoleInfo.trim() &&
      !form.securityAndBackground.judicialRoleInfo.trim()
    ) {
      return "Заполните хотя бы один подпункт п. 93.";
    }
  }

  if (!form.securityAndBackground.biometricSubmissionCity) {
    return "Выберите п. 95 (визовый центр для биометрии).";
  }

  return null;
}

const STEP_VALIDATORS = [
  validatePersonalStep,
  validatePassportStep,
  validateEmploymentStep,
  validateTripStep,
  validateFamilyStep,
  validateTravelHistoryStep,
  validateSecurityStep,
] as const;

export const WIZARD_STEP_COUNT = STEP_VALIDATORS.length;

export function validateFormStep(stepIndex: number, form: SubmitFormRequest): string | null {
  if (stepIndex < 0 || stepIndex >= STEP_VALIDATORS.length) {
    return null;
  }
  return STEP_VALIDATORS[stepIndex](form);
}

export function validateForm(form: SubmitFormRequest): string | null {
  for (let i = 0; i < STEP_VALIDATORS.length; i++) {
    const err = STEP_VALIDATORS[i](form);
    if (err) {
      return err;
    }
  }
  return null;
}
