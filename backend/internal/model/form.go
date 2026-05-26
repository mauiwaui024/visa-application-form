package model

type YesNo string

type SubmitFormRequest struct {
	PersonalDetails       PersonalDetails       `json:"personalDetails"`
	PassportDetails       PassportDetails       `json:"passportDetails"`
	EmploymentAndFinance  EmploymentAndFinance  `json:"employmentAndFinance"`
	TripDetails           TripDetails           `json:"tripDetails"`
	FamilyAndDependants   FamilyAndDependants   `json:"familyAndDependants"`
	TravelHistory         TravelHistory         `json:"travelHistory"`
	SecurityAndBackground SecurityAndBackground `json:"securityAndBackground"`
}

type PersonalDetails struct {
	FullNamePassport          string `json:"fullNamePassport"`
	OtherNames                string `json:"otherNames"`
	ResidentialAddress        string `json:"residentialAddress"`
	ResidentialAddressPostCode string `json:"residentialAddressPostalCode"`
	YearsAtAddress            string `json:"yearsAtAddress"`
	MonthsAtAddress           string `json:"monthsAtAddress"`
	PreviousAddress           string `json:"previousAddress"`
	PreviousAddressFrom       string `json:"previousAddressFrom"`
	PreviousAddressTo         string `json:"previousAddressTo"`
	MobilePhone               string `json:"mobilePhone"`
	Email                     string `json:"email"`
	HousingStatus             string `json:"housingStatus"`
	HousingStatusDetails      string `json:"housingStatusDetails"`
	MaritalStatus             string `json:"maritalStatus"`
	Citizenship               string `json:"citizenship"`
	SecondCitizenshipCountry  string `json:"secondCitizenshipCountry"`
	OtherCitizenshipCountry   string `json:"otherCitizenshipCountry"`
	BirthDate                 string `json:"birthDate"`
	BirthCountry              string `json:"birthCountry"`
	BirthPlace                string `json:"birthPlace"`
}

type PassportDetails struct {
	CurrentPassportNumber           string `json:"currentPassportNumber"`
	CurrentPassportIssuingAuthority string `json:"currentPassportIssuingAuthority"`
	CurrentPassportValidFrom        string `json:"currentPassportValidFrom"`
	CurrentPassportValidTo          string `json:"currentPassportValidTo"`
	HasOtherPassport                YesNo  `json:"hasOtherPassport"`
	OtherPassportNumber             string `json:"otherPassportNumber"`
	OtherPassportIssuingAuthority   string `json:"otherPassportIssuingAuthority"`
	OtherPassportIssueDate          string `json:"otherPassportIssueDate"`
	OtherPassportExpiryDate         string `json:"otherPassportExpiryDate"`
	NationalPassportNumber          string `json:"nationalPassportNumber"`
}

type EmploymentAndFinance struct {
	EmploymentStatuses         []string `json:"employmentStatuses"`
	OrganizationName           string   `json:"organizationName"`
	OrganizationAddress        string   `json:"organizationAddress"`
	WorkPhone                  string   `json:"workPhone"`
	WorkStartDate              string   `json:"workStartDate"`
	Position                   string   `json:"position"`
	MonthlyIncomeAfterTax      string   `json:"monthlyIncomeAfterTax"`
	WorkDescription            string   `json:"workDescription"`
	HasOtherIncome             YesNo    `json:"hasOtherIncome"`
	OtherIncomeSources         []string `json:"otherIncomeSources"`
	OtherIncomeTotalYear       string   `json:"otherIncomeTotalYear"`
	HasSavings                 YesNo    `json:"hasSavings"`
	SavingsBalance             string   `json:"savingsBalance"`
	MonthlyExpenses            string   `json:"monthlyExpenses"`
	TripPersonalCost           string   `json:"tripPersonalCost"`
	HasTripSponsor             YesNo    `json:"hasTripSponsor"`
	SponsorType                string   `json:"sponsorType"`
	SponsorPersonFullName      string   `json:"sponsorPersonFullName"`
	SponsorPersonAddress       string   `json:"sponsorPersonAddress"`
	SponsorPersonAmount        string   `json:"sponsorPersonAmount"`
	SponsorPersonReason        string   `json:"sponsorPersonReason"`
	SponsorEmployerAmount      string   `json:"sponsorEmployerAmount"`
	SponsorEmployerReason      string   `json:"sponsorEmployerReason"`
	SponsorOrganizationName    string   `json:"sponsorOrganizationName"`
	SponsorOrganizationAddress string   `json:"sponsorOrganizationAddress"`
	SponsorOrganizationAmount  string   `json:"sponsorOrganizationAmount"`
	SponsorOrganizationReason  string   `json:"sponsorOrganizationReason"`
}

type TripDetails struct {
	ArrivalDateUk         string              `json:"arrivalDateUk"`
	DepartureDateUk       string              `json:"departureDateUk"`
	PrimaryPurpose        string              `json:"primaryPurpose"`
	TravelWithNonDependent YesNo              `json:"travelWithNonDependent"`
	Companion             TripCompanion       `json:"companion"`
	AccommodationType     string              `json:"accommodationType"`
	HotelNameAndAddress   string              `json:"hotelNameAndAddress"`
	RelativeNameAndAddress string             `json:"relativeNameAndAddress"`
	FriendNameAndAddress  string              `json:"friendNameAndAddress"`
	IsBusinessTrip        YesNo               `json:"isBusinessTrip"`
	BusinessTrip          BusinessTripDetails `json:"businessTrip"`
}

type TripCompanion struct {
	FullName     string `json:"fullName"`
	Citizenship  string `json:"citizenship"`
	Relationship string `json:"relationship"`
}

type BusinessTripDetails struct {
	InvitingCompanyName      string `json:"invitingCompanyName"`
	InviterFullName          string `json:"inviterFullName"`
	InvitingCompanyActivity  string `json:"invitingCompanyActivity"`
	InvitingCompanyAddressUk string `json:"invitingCompanyAddressUk"`
	InvitingCompanyPhone     string `json:"invitingCompanyPhone"`
	PlannedBusinessActivities string `json:"plannedBusinessActivities"`
}

type FamilyAndDependants struct {
	Spouse                SpouseDetails       `json:"spouse"`
	Father                ParentDetails       `json:"father"`
	Mother                ParentDetails       `json:"mother"`
	ChildDependant        ChildDependant      `json:"childDependant"`
	HasUkRelatives        YesNo               `json:"hasUkRelatives"`
	UkRelativesRelationship string            `json:"ukRelativesRelationship"`
	UkRelatives           []UkRelative        `json:"ukRelatives"`
}

type SpouseDetails struct {
	FullName            string `json:"fullName"`
	Citizenship         string `json:"citizenship"`
	BirthDate           string `json:"birthDate"`
	PassportNumber      string `json:"passportNumber"`
	TravelsWithApplicant YesNo `json:"travelsWithApplicant"`
	LivesWithApplicant   YesNo `json:"livesWithApplicant"`
	ResidentialAddress  string `json:"residentialAddress"`
	ResidentialCountry  string `json:"residentialCountry"`
}

type ParentDetails struct {
	FirstName                 string `json:"firstName"`
	LastName                  string `json:"lastName"`
	BirthDate                 string `json:"birthDate"`
	Citizenship               string `json:"citizenship"`
	HadSingleCitizenship      YesNo  `json:"hadSingleCitizenship"`
	CitizenshipAtApplicantBirth string `json:"citizenshipAtApplicantBirth"`
}

type ChildDependant struct {
	HasDependants           YesNo  `json:"hasDependants"`
	ChildFullName           string `json:"childFullName"`
	ChildBirthDate          string `json:"childBirthDate"`
	ChildBirthPlace         string `json:"childBirthPlace"`
	ChildCitizenship        string `json:"childCitizenship"`
	ChildPassportNumber     string `json:"childPassportNumber"`
	ChildTravelsWithApplicant YesNo `json:"childTravelsWithApplicant"`
	ChildLivesWithApplicant YesNo  `json:"childLivesWithApplicant"`
	ChildResidentialAddress string `json:"childResidentialAddress"`
}

type UkRelative struct {
	FullName                        string `json:"fullName"`
	Citizenship                     string `json:"citizenship"`
	UkStayBasis                     string `json:"ukStayBasis"`
	PassportOrResidencePermitNumber string `json:"passportOrResidencePermitNumber"`
}

type TravelHistory struct {
	HadUkVisaBefore                 YesNo       `json:"hadUkVisaBefore"`
	UkVisaIssuedMonthYear           string      `json:"ukVisaIssuedMonthYear"`
	UkVisitsLast10Years             string      `json:"ukVisitsLast10Years"`
	UkTripHistory                   []TripRecord `json:"ukTripHistory"`
	HadUkVisaRefusal                YesNo       `json:"hadUkVisaRefusal"`
	HadUkEntryRefusal               YesNo       `json:"hadUkEntryRefusal"`
	HadUkDeportation                YesNo       `json:"hadUkDeportation"`
	UkRefusalOrDeportationDate      string      `json:"ukRefusalOrDeportationDate"`
	UkRefusalOrDeportationReason    string      `json:"ukRefusalOrDeportationReason"`
	HadOtherVisaRefusal             YesNo       `json:"hadOtherVisaRefusal"`
	HadOtherEntryRefusal            YesNo       `json:"hadOtherEntryRefusal"`
	HadOtherDeportation             YesNo       `json:"hadOtherDeportation"`
	OtherRefusalCountry             string      `json:"otherRefusalCountry"`
	OtherRefusalOrDeportationDate   string      `json:"otherRefusalOrDeportationDate"`
	OtherRefusalOrDeportationReason string      `json:"otherRefusalOrDeportationReason"`
	TraveledAbroadLast10YearsExcludingUk YesNo `json:"traveledAbroadLast10YearsExcludingUk"`
	MajorCountryTrips               []TripRecord `json:"majorCountryTrips"`
	OtherCountryTrips               []TripRecord `json:"otherCountryTrips"`
}

type TripRecord struct {
	Purpose   string `json:"purpose"`
	EntryDate string `json:"entryDate"`
	ExitDate  string `json:"exitDate"`
	DaysStayed string `json:"daysStayed"`
	Country   string `json:"country"`
}

type SecurityAndBackground struct {
	ConvictedCriminalOffence      YesNo  `json:"convictedCriminalOffence"`
	TrafficOffencePenalty         YesNo  `json:"trafficOffencePenalty"`
	ChargedOrAwaitingTrial        YesNo  `json:"chargedOrAwaitingTrial"`
	WarningOrOtherPenalty         YesNo  `json:"warningOrOtherPenalty"`
	CivilJudgementOrBankruptcy    YesNo  `json:"civilJudgementOrBankruptcy"`
	CriminalDetails               string `json:"criminalDetails"`
	InvolvedInWarCrimesOrGenocide YesNo  `json:"involvedInWarCrimesOrGenocide"`
	InvolvedWithTerroristOrganization YesNo `json:"involvedWithTerroristOrganization"`
	ExpressedTerrorismSupportViews YesNo `json:"expressedTerrorismSupportViews"`
	SecurityDetails               string `json:"securityDetails"`
	WorkedInListedOrganizations   YesNo  `json:"workedInListedOrganizations"`
	ArmedForcesInfo               string `json:"armedForcesInfo"`
	GovernmentRoleInfo            string `json:"governmentRoleInfo"`
	MediaRoleInfo                 string `json:"mediaRoleInfo"`
	SecurityRoleInfo              string `json:"securityRoleInfo"`
	AdministrativeRoleInfo        string `json:"administrativeRoleInfo"`
	JudicialRoleInfo              string `json:"judicialRoleInfo"`
	AdditionalInformation         string `json:"additionalInformation"`
	BiometricSubmissionCity       string `json:"biometricSubmissionCity"`
}

type SubmitFormResponse struct {
	Status string `json:"status"`
}
