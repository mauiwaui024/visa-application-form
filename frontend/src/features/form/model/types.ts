export type YesNo = "yes" | "no" | "";

export type PersonalDetails = {
  fullNamePassport: string;
  otherNames: string;
  residentialAddress: string;
  residentialAddressPostalCode: string;
  yearsAtAddress: string;
  monthsAtAddress: string;
  previousAddress: string;
  previousAddressFrom: string;
  previousAddressTo: string;
  mobilePhone: string;
  email: string;
  housingStatus: "owner" | "rent" | "family" | "other" | "";
  housingStatusDetails: string;
  maritalStatus: "single" | "married" | "divorced" | "widowed" | "";
  citizenship: string;
  secondCitizenshipCountry: string;
  otherCitizenshipCountry: string;
  birthDate: string;
  birthCountry: string;
  birthPlace: string;
};

export type PassportDetails = {
  currentPassportNumber: string;
  currentPassportIssuingAuthority: string;
  currentPassportValidFrom: string;
  currentPassportValidTo: string;
  hasOtherPassport: YesNo;
  otherPassportNumber: string;
  otherPassportIssuingAuthority: string;
  otherPassportIssueDate: string;
  otherPassportExpiryDate: string;
  nationalPassportNumber: string;
};

export type EmploymentDetails = {
  employmentStatuses: Array<
    "fullTime" | "entrepreneur" | "student" | "retired" | "unemployed"
  >;
  organizationName: string;
  organizationAddress: string;
  workPhone: string;
  workStartDate: string;
  position: string;
  monthlyIncomeAfterTax: string;
  workDescription: string;
  hasOtherIncome: YesNo;
  otherIncomeSources: Array<"family" | "pension" | "investments" | "rent">;
  otherIncomeTotalYear: string;
  hasSavings: YesNo;
  savingsBalance: string;
  monthlyExpenses: string;
  tripPersonalCost: string;
  hasTripSponsor: YesNo;
  sponsorType: "familyOrFriend" | "employer" | "organization" | "";
  sponsorPersonFullName: string;
  sponsorPersonAddress: string;
  sponsorPersonAmount: string;
  sponsorPersonReason: string;
  sponsorEmployerAmount: string;
  sponsorEmployerReason: string;
  sponsorOrganizationName: string;
  sponsorOrganizationAddress: string;
  sponsorOrganizationAmount: string;
  sponsorOrganizationReason: string;
};

export type TripCompanion = {
  fullName: string;
  citizenship: string;
  relationship: string;
};

export type BusinessTripDetails = {
  invitingCompanyName: string;
  inviterFullName: string;
  invitingCompanyActivity: string;
  invitingCompanyAddressUk: string;
  invitingCompanyPhone: string;
  plannedBusinessActivities: string;
};

export type TripDetails = {
  arrivalDateUk: string;
  departureDateUk: string;
  primaryPurpose: string;
  travelWithNonDependent: YesNo;
  companion: TripCompanion;
  accommodationType: "hotel" | "relative" | "friend" | "";
  hotelNameAndAddress: string;
  relativeNameAndAddress: string;
  friendNameAndAddress: string;
  isBusinessTrip: YesNo;
  businessTrip: BusinessTripDetails;
};

export type SpouseDetails = {
  fullName: string;
  citizenship: string;
  birthDate: string;
  passportNumber: string;
  travelsWithApplicant: YesNo;
  livesWithApplicant: YesNo;
  residentialAddress: string;
  residentialCountry: string;
};

export type ParentDetails = {
  firstName: string;
  lastName: string;
  birthDate: string;
  citizenship: string;
  hadSingleCitizenship: YesNo;
  citizenshipAtApplicantBirth: string;
};

export type ChildDependantDetails = {
  hasDependants: YesNo;
  childFullName: string;
  childBirthDate: string;
  childBirthPlace: string;
  childCitizenship: string;
  childPassportNumber: string;
  childTravelsWithApplicant: YesNo;
  childLivesWithApplicant: YesNo;
  childResidentialAddress: string;
};

export type UkRelative = {
  fullName: string;
  citizenship: string;
  ukStayBasis: "temporaryVisa" | "permanentResidence" | "";
  passportOrResidencePermitNumber: string;
};

export type FamilyAndDependantsDetails = {
  spouse: SpouseDetails;
  father: ParentDetails;
  mother: ParentDetails;
  childDependant: ChildDependantDetails;
  hasUkRelatives: YesNo;
  ukRelativesRelationship: string;
  ukRelatives: [UkRelative, UkRelative];
};

export type TripRecord = {
  purpose: string;
  entryDate: string;
  exitDate: string;
  daysStayed: string;
  country: string;
};

export type TravelHistoryDetails = {
  hadUkVisaBefore: YesNo;
  ukVisaIssuedMonthYear: string;
  ukVisitsLast10Years: "none" | "once" | "2to5" | "6plus" | "";
  ukTripHistory: [TripRecord, TripRecord, TripRecord];
  hadUkVisaRefusal: YesNo;
  hadUkEntryRefusal: YesNo;
  hadUkDeportation: YesNo;
  ukRefusalOrDeportationDate: string;
  ukRefusalOrDeportationReason: string;
  hadOtherVisaRefusal: YesNo;
  hadOtherEntryRefusal: YesNo;
  hadOtherDeportation: YesNo;
  otherRefusalCountry: string;
  otherRefusalOrDeportationDate: string;
  otherRefusalOrDeportationReason: string;
  traveledAbroadLast10YearsExcludingUk: YesNo;
  majorCountryTrips: [TripRecord, TripRecord];
  otherCountryTrips: [TripRecord, TripRecord, TripRecord];
};

export type SecurityAndBackgroundDetails = {
  convictedCriminalOffence: YesNo;
  trafficOffencePenalty: YesNo;
  chargedOrAwaitingTrial: YesNo;
  warningOrOtherPenalty: YesNo;
  civilJudgementOrBankruptcy: YesNo;
  criminalDetails: string;
  involvedInWarCrimesOrGenocide: YesNo;
  involvedWithTerroristOrganization: YesNo;
  expressedTerrorismSupportViews: YesNo;
  securityDetails: string;
  workedInListedOrganizations: YesNo;
  armedForcesInfo: string;
  governmentRoleInfo: string;
  mediaRoleInfo: string;
  securityRoleInfo: string;
  administrativeRoleInfo: string;
  judicialRoleInfo: string;
  additionalInformation: string;
  biometricSubmissionCity:
    | "moscow"
    | "saintPetersburg"
    | "rostovOnDon"
    | "yekaterinburg"
    | "novosibirsk"
    | "";
};

export type SubmitFormRequest = {
  personalDetails: PersonalDetails;
  passportDetails: PassportDetails;
  employmentAndFinance: EmploymentDetails;
  tripDetails: TripDetails;
  familyAndDependants: FamilyAndDependantsDetails;
  travelHistory: TravelHistoryDetails;
  securityAndBackground: SecurityAndBackgroundDetails;
};

const emptyTripRecord = (): TripRecord => ({
  purpose: "",
  entryDate: "",
  exitDate: "",
  daysStayed: "",
  country: "",
});

const emptyUkRelative = (): UkRelative => ({
  fullName: "",
  citizenship: "",
  ukStayBasis: "",
  passportOrResidencePermitNumber: "",
});

const createEmptySubmitFormRequest = (): SubmitFormRequest => ({
  personalDetails: {
    fullNamePassport: "",
    otherNames: "",
    residentialAddress: "",
    residentialAddressPostalCode: "",
    yearsAtAddress: "",
    monthsAtAddress: "",
    previousAddress: "",
    previousAddressFrom: "",
    previousAddressTo: "",
    mobilePhone: "",
    email: "",
    housingStatus: "",
    housingStatusDetails: "",
    maritalStatus: "",
    citizenship: "",
    secondCitizenshipCountry: "",
    otherCitizenshipCountry: "",
    birthDate: "",
    birthCountry: "",
    birthPlace: "",
  },
  passportDetails: {
    currentPassportNumber: "",
    currentPassportIssuingAuthority: "",
    currentPassportValidFrom: "",
    currentPassportValidTo: "",
    hasOtherPassport: "",
    otherPassportNumber: "",
    otherPassportIssuingAuthority: "",
    otherPassportIssueDate: "",
    otherPassportExpiryDate: "",
    nationalPassportNumber: "",
  },
  employmentAndFinance: {
    employmentStatuses: [],
    organizationName: "",
    organizationAddress: "",
    workPhone: "",
    workStartDate: "",
    position: "",
    monthlyIncomeAfterTax: "",
    workDescription: "",
    hasOtherIncome: "",
    otherIncomeSources: [],
    otherIncomeTotalYear: "",
    hasSavings: "",
    savingsBalance: "",
    monthlyExpenses: "",
    tripPersonalCost: "",
    hasTripSponsor: "",
    sponsorType: "",
    sponsorPersonFullName: "",
    sponsorPersonAddress: "",
    sponsorPersonAmount: "",
    sponsorPersonReason: "",
    sponsorEmployerAmount: "",
    sponsorEmployerReason: "",
    sponsorOrganizationName: "",
    sponsorOrganizationAddress: "",
    sponsorOrganizationAmount: "",
    sponsorOrganizationReason: "",
  },
  tripDetails: {
    arrivalDateUk: "",
    departureDateUk: "",
    primaryPurpose: "",
    travelWithNonDependent: "",
    companion: {
      fullName: "",
      citizenship: "",
      relationship: "",
    },
    accommodationType: "",
    hotelNameAndAddress: "",
    relativeNameAndAddress: "",
    friendNameAndAddress: "",
    isBusinessTrip: "",
    businessTrip: {
      invitingCompanyName: "",
      inviterFullName: "",
      invitingCompanyActivity: "",
      invitingCompanyAddressUk: "",
      invitingCompanyPhone: "",
      plannedBusinessActivities: "",
    },
  },
  familyAndDependants: {
    spouse: {
      fullName: "",
      citizenship: "",
      birthDate: "",
      passportNumber: "",
      travelsWithApplicant: "",
      livesWithApplicant: "",
      residentialAddress: "",
      residentialCountry: "",
    },
    father: {
      firstName: "",
      lastName: "",
      birthDate: "",
      citizenship: "",
      hadSingleCitizenship: "",
      citizenshipAtApplicantBirth: "",
    },
    mother: {
      firstName: "",
      lastName: "",
      birthDate: "",
      citizenship: "",
      hadSingleCitizenship: "",
      citizenshipAtApplicantBirth: "",
    },
    childDependant: {
      hasDependants: "",
      childFullName: "",
      childBirthDate: "",
      childBirthPlace: "",
      childCitizenship: "",
      childPassportNumber: "",
      childTravelsWithApplicant: "",
      childLivesWithApplicant: "",
      childResidentialAddress: "",
    },
    hasUkRelatives: "",
    ukRelativesRelationship: "",
    ukRelatives: [emptyUkRelative(), emptyUkRelative()],
  },
  travelHistory: {
    hadUkVisaBefore: "",
    ukVisaIssuedMonthYear: "",
    ukVisitsLast10Years: "",
    ukTripHistory: [emptyTripRecord(), emptyTripRecord(), emptyTripRecord()],
    hadUkVisaRefusal: "",
    hadUkEntryRefusal: "",
    hadUkDeportation: "",
    ukRefusalOrDeportationDate: "",
    ukRefusalOrDeportationReason: "",
    hadOtherVisaRefusal: "",
    hadOtherEntryRefusal: "",
    hadOtherDeportation: "",
    otherRefusalCountry: "",
    otherRefusalOrDeportationDate: "",
    otherRefusalOrDeportationReason: "",
    traveledAbroadLast10YearsExcludingUk: "no",
    majorCountryTrips: [emptyTripRecord(), emptyTripRecord()],
    otherCountryTrips: [emptyTripRecord(), emptyTripRecord(), emptyTripRecord()],
  },
  securityAndBackground: {
    convictedCriminalOffence: "",
    trafficOffencePenalty: "",
    chargedOrAwaitingTrial: "",
    warningOrOtherPenalty: "",
    civilJudgementOrBankruptcy: "",
    criminalDetails: "",
    involvedInWarCrimesOrGenocide: "",
    involvedWithTerroristOrganization: "",
    expressedTerrorismSupportViews: "",
    securityDetails: "",
    workedInListedOrganizations: "",
    armedForcesInfo: "",
    governmentRoleInfo: "",
    mediaRoleInfo: "",
    securityRoleInfo: "",
    administrativeRoleInfo: "",
    judicialRoleInfo: "",
    additionalInformation: "",
    biometricSubmissionCity: "",
  },
});

/** Заполняет все поля вымышленными данными; проходит клиентскую валидацию (для ручного теста в dev). */
const createDevTestSubmitFormRequest = (): SubmitFormRequest => ({
  personalDetails: {
    fullNamePassport: "Тестов Тест Тестович",
    otherNames: "—",
    residentialAddress: "Россия, г. Москва, ул. Примерная, д. 1, кв. 2",
    residentialAddressPostalCode: "123456",
    yearsAtAddress: "5",
    monthsAtAddress: "3",
    previousAddress: "Россия, г. Санкт-Петербург, пр. Невский, д. 10",
    previousAddressFrom: "2015-01-01",
    previousAddressTo: "2019-06-30",
    mobilePhone: "+79001234567",
    email: "applicant.test@example.com",
    housingStatus: "owner",
    housingStatusDetails: "",
    maritalStatus: "single",
    citizenship: "Россия",
    secondCitizenshipCountry: "",
    otherCitizenshipCountry: "",
    birthDate: "1990-05-15",
    birthCountry: "Россия",
    birthPlace: "г. Москва",
  },
  passportDetails: {
    currentPassportNumber: "12 3456789",
    currentPassportIssuingAuthority: "МВД 77001",
    currentPassportValidFrom: "2020-03-01",
    currentPassportValidTo: "2030-03-01",
    hasOtherPassport: "no",
    otherPassportNumber: "",
    otherPassportIssuingAuthority: "",
    otherPassportIssueDate: "",
    otherPassportExpiryDate: "",
    nationalPassportNumber: "4510 123456",
  },
  employmentAndFinance: {
    employmentStatuses: ["fullTime"],
    organizationName: 'ООО "Тестовая компания"',
    organizationAddress: "Москва, ул. Деловая, д. 5",
    workPhone: "+74951234567",
    workStartDate: "2018-09-01",
    position: "Инженер",
    monthlyIncomeAfterTax: "150000",
    workDescription: "Разработка ПО, тестовые данные для анкеты.",
    hasOtherIncome: "no",
    otherIncomeSources: [],
    otherIncomeTotalYear: "",
    hasSavings: "no",
    savingsBalance: "",
    monthlyExpenses: "80000",
    tripPersonalCost: "50000",
    hasTripSponsor: "no",
    sponsorType: "",
    sponsorPersonFullName: "",
    sponsorPersonAddress: "",
    sponsorPersonAmount: "",
    sponsorPersonReason: "",
    sponsorEmployerAmount: "",
    sponsorEmployerReason: "",
    sponsorOrganizationName: "",
    sponsorOrganizationAddress: "",
    sponsorOrganizationAmount: "",
    sponsorOrganizationReason: "",
  },
  tripDetails: {
    arrivalDateUk: "2026-07-01",
    departureDateUk: "2026-07-14",
    primaryPurpose: "Туризм, осмотр достопримечательностей",
    travelWithNonDependent: "no",
    companion: {
      fullName: "",
      citizenship: "",
      relationship: "",
    },
    accommodationType: "hotel",
    hotelNameAndAddress: "The Test Hotel, 1 Example Street, London, SW1A 1AA",
    relativeNameAndAddress: "",
    friendNameAndAddress: "",
    isBusinessTrip: "no",
    businessTrip: {
      invitingCompanyName: "Test UK Ltd",
      inviterFullName: "John Smith",
      invitingCompanyActivity: "IT consulting",
      invitingCompanyAddressUk: "10 Business Rd, London",
      invitingCompanyPhone: "+442071234567",
      plannedBusinessActivities: "Встречи с партнёрами (тестовые данные).",
    },
  },
  familyAndDependants: {
    spouse: {
      fullName: "",
      citizenship: "",
      birthDate: "",
      passportNumber: "",
      travelsWithApplicant: "",
      livesWithApplicant: "",
      residentialAddress: "",
      residentialCountry: "",
    },
    father: {
      firstName: "Пётр",
      lastName: "Тестов",
      birthDate: "1960-04-20",
      citizenship: "Россия",
      hadSingleCitizenship: "yes",
      citizenshipAtApplicantBirth: "Россия",
    },
    mother: {
      firstName: "Мария",
      lastName: "Тестова",
      birthDate: "1962-08-11",
      citizenship: "Россия",
      hadSingleCitizenship: "yes",
      citizenshipAtApplicantBirth: "Россия",
    },
    childDependant: {
      hasDependants: "no",
      childFullName: "",
      childBirthDate: "",
      childBirthPlace: "",
      childCitizenship: "",
      childPassportNumber: "",
      childTravelsWithApplicant: "",
      childLivesWithApplicant: "",
      childResidentialAddress: "",
    },
    hasUkRelatives: "no",
    ukRelativesRelationship: "",
    ukRelatives: [
      {
        fullName: "Jane Relative",
        citizenship: "UK",
        ukStayBasis: "permanentResidence",
        passportOrResidencePermitNumber: "AB1234567",
      },
      {
        fullName: "Bob Relative",
        citizenship: "UK",
        ukStayBasis: "temporaryVisa",
        passportOrResidencePermitNumber: "CD7654321",
      },
    ],
  },
  travelHistory: {
    hadUkVisaBefore: "no",
    ukVisaIssuedMonthYear: "",
    ukVisitsLast10Years: "none",
    ukTripHistory: [emptyTripRecord(), emptyTripRecord(), emptyTripRecord()],
    hadUkVisaRefusal: "no",
    hadUkEntryRefusal: "no",
    hadUkDeportation: "no",
    ukRefusalOrDeportationDate: "",
    ukRefusalOrDeportationReason: "",
    hadOtherVisaRefusal: "no",
    hadOtherEntryRefusal: "no",
    hadOtherDeportation: "no",
    otherRefusalCountry: "",
    otherRefusalOrDeportationDate: "",
    otherRefusalOrDeportationReason: "",
    traveledAbroadLast10YearsExcludingUk: "no",
    majorCountryTrips: [emptyTripRecord(), emptyTripRecord()],
    otherCountryTrips: [emptyTripRecord(), emptyTripRecord(), emptyTripRecord()],
  },
  securityAndBackground: {
    convictedCriminalOffence: "no",
    trafficOffencePenalty: "no",
    chargedOrAwaitingTrial: "no",
    warningOrOtherPenalty: "no",
    civilJudgementOrBankruptcy: "no",
    criminalDetails: "",
    involvedInWarCrimesOrGenocide: "no",
    involvedWithTerroristOrganization: "no",
    expressedTerrorismSupportViews: "no",
    securityDetails: "",
    workedInListedOrganizations: "no",
    armedForcesInfo: "",
    governmentRoleInfo: "",
    mediaRoleInfo: "",
    securityRoleInfo: "",
    administrativeRoleInfo: "",
    judicialRoleInfo: "",
    additionalInformation: "Тестовая анкета, данные вымышлены.",
    biometricSubmissionCity: "moscow",
  },
});

export const createInitialSubmitFormRequest = (): SubmitFormRequest =>
  import.meta.env.DEV ? createDevTestSubmitFormRequest() : createEmptySubmitFormRequest();

export type SubmitFormResponse = {
  status: "ok";
};
