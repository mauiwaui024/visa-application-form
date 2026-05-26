package form_sender

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"

	"visa-application-form/backend/internal/model"
)

type Repository struct {
	db *sqlx.DB
}

func NewSQLXFormRepository(db *sqlx.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Save(ctx context.Context, form model.SubmitFormRequest) error {
	ukRelative1 := relativeAt(form.FamilyAndDependants.UkRelatives, 0)
	ukRelative2 := relativeAt(form.FamilyAndDependants.UkRelatives, 1)

	ukTrip1 := tripAt(form.TravelHistory.UkTripHistory, 0)
	ukTrip2 := tripAt(form.TravelHistory.UkTripHistory, 1)
	ukTrip3 := tripAt(form.TravelHistory.UkTripHistory, 2)

	majorTrip1 := tripAt(form.TravelHistory.MajorCountryTrips, 0)
	majorTrip2 := tripAt(form.TravelHistory.MajorCountryTrips, 1)

	otherTrip1 := tripAt(form.TravelHistory.OtherCountryTrips, 0)
	otherTrip2 := tripAt(form.TravelHistory.OtherCountryTrips, 1)
	otherTrip3 := tripAt(form.TravelHistory.OtherCountryTrips, 2)

	var columns []string
	var values []any
	add := func(column string, value any) {
		columns = append(columns, column)
		values = append(values, value)
	}

	add("full_name_passport", form.PersonalDetails.FullNamePassport)
	add("other_names", form.PersonalDetails.OtherNames)
	add("residential_address", form.PersonalDetails.ResidentialAddress)
	add("residential_address_postal_code", form.PersonalDetails.ResidentialAddressPostCode)
	add("years_at_address", form.PersonalDetails.YearsAtAddress)
	add("months_at_address", form.PersonalDetails.MonthsAtAddress)
	add("previous_address", form.PersonalDetails.PreviousAddress)
	add("previous_address_from", form.PersonalDetails.PreviousAddressFrom)
	add("previous_address_to", form.PersonalDetails.PreviousAddressTo)
	add("mobile_phone", form.PersonalDetails.MobilePhone)
	add("email", form.PersonalDetails.Email)
	add("housing_status", form.PersonalDetails.HousingStatus)
	add("housing_status_details", form.PersonalDetails.HousingStatusDetails)
	add("marital_status", form.PersonalDetails.MaritalStatus)
	add("citizenship", form.PersonalDetails.Citizenship)
	add("second_citizenship_country", form.PersonalDetails.SecondCitizenshipCountry)
	add("other_citizenship_country", form.PersonalDetails.OtherCitizenshipCountry)
	add("birth_date", form.PersonalDetails.BirthDate)
	add("birth_country", form.PersonalDetails.BirthCountry)
	add("birth_place", form.PersonalDetails.BirthPlace)

	add("current_passport_number", form.PassportDetails.CurrentPassportNumber)
	add("current_passport_issuing_authority", form.PassportDetails.CurrentPassportIssuingAuthority)
	add("current_passport_valid_from", form.PassportDetails.CurrentPassportValidFrom)
	add("current_passport_valid_to", form.PassportDetails.CurrentPassportValidTo)
	add("has_other_passport", string(form.PassportDetails.HasOtherPassport))
	add("other_passport_number", form.PassportDetails.OtherPassportNumber)
	add("other_passport_issuing_authority", form.PassportDetails.OtherPassportIssuingAuthority)
	add("other_passport_issue_date", form.PassportDetails.OtherPassportIssueDate)
	add("other_passport_expiry_date", form.PassportDetails.OtherPassportExpiryDate)
	add("national_passport_number", form.PassportDetails.NationalPassportNumber)

	add("employment_statuses", strings.Join(form.EmploymentAndFinance.EmploymentStatuses, ", "))
	add("organization_name", form.EmploymentAndFinance.OrganizationName)
	add("organization_address", form.EmploymentAndFinance.OrganizationAddress)
	add("work_phone", form.EmploymentAndFinance.WorkPhone)
	add("work_start_date", form.EmploymentAndFinance.WorkStartDate)
	add("position", form.EmploymentAndFinance.Position)
	add("monthly_income_after_tax", form.EmploymentAndFinance.MonthlyIncomeAfterTax)
	add("work_description", form.EmploymentAndFinance.WorkDescription)
	add("has_other_income", string(form.EmploymentAndFinance.HasOtherIncome))
	add("other_income_sources", strings.Join(form.EmploymentAndFinance.OtherIncomeSources, ", "))
	add("other_income_total_year", form.EmploymentAndFinance.OtherIncomeTotalYear)
	add("has_savings", string(form.EmploymentAndFinance.HasSavings))
	add("savings_balance", form.EmploymentAndFinance.SavingsBalance)
	add("monthly_expenses", form.EmploymentAndFinance.MonthlyExpenses)
	add("trip_personal_cost", form.EmploymentAndFinance.TripPersonalCost)
	add("has_trip_sponsor", string(form.EmploymentAndFinance.HasTripSponsor))
	add("sponsor_type", form.EmploymentAndFinance.SponsorType)
	add("sponsor_person_full_name", form.EmploymentAndFinance.SponsorPersonFullName)
	add("sponsor_person_address", form.EmploymentAndFinance.SponsorPersonAddress)
	add("sponsor_person_amount", form.EmploymentAndFinance.SponsorPersonAmount)
	add("sponsor_person_reason", form.EmploymentAndFinance.SponsorPersonReason)
	add("sponsor_employer_amount", form.EmploymentAndFinance.SponsorEmployerAmount)
	add("sponsor_employer_reason", form.EmploymentAndFinance.SponsorEmployerReason)
	add("sponsor_organization_name", form.EmploymentAndFinance.SponsorOrganizationName)
	add("sponsor_organization_address", form.EmploymentAndFinance.SponsorOrganizationAddress)
	add("sponsor_organization_amount", form.EmploymentAndFinance.SponsorOrganizationAmount)
	add("sponsor_organization_reason", form.EmploymentAndFinance.SponsorOrganizationReason)

	add("arrival_date_uk", form.TripDetails.ArrivalDateUk)
	add("departure_date_uk", form.TripDetails.DepartureDateUk)
	add("primary_purpose", form.TripDetails.PrimaryPurpose)
	add("travel_with_non_dependent", string(form.TripDetails.TravelWithNonDependent))
	add("companion_full_name", form.TripDetails.Companion.FullName)
	add("companion_citizenship", form.TripDetails.Companion.Citizenship)
	add("companion_relationship", form.TripDetails.Companion.Relationship)
	add("accommodation_type", form.TripDetails.AccommodationType)
	add("hotel_name_and_address", form.TripDetails.HotelNameAndAddress)
	add("relative_name_and_address", form.TripDetails.RelativeNameAndAddress)
	add("friend_name_and_address", form.TripDetails.FriendNameAndAddress)
	add("is_business_trip", string(form.TripDetails.IsBusinessTrip))
	add("business_inviting_company_name", form.TripDetails.BusinessTrip.InvitingCompanyName)
	add("business_inviter_full_name", form.TripDetails.BusinessTrip.InviterFullName)
	add("business_inviting_company_activity", form.TripDetails.BusinessTrip.InvitingCompanyActivity)
	add("business_inviting_company_address_uk", form.TripDetails.BusinessTrip.InvitingCompanyAddressUk)
	add("business_inviting_company_phone", form.TripDetails.BusinessTrip.InvitingCompanyPhone)
	add("business_planned_activities", form.TripDetails.BusinessTrip.PlannedBusinessActivities)

	add("spouse_full_name", form.FamilyAndDependants.Spouse.FullName)
	add("spouse_citizenship", form.FamilyAndDependants.Spouse.Citizenship)
	add("spouse_birth_date", form.FamilyAndDependants.Spouse.BirthDate)
	add("spouse_passport_number", form.FamilyAndDependants.Spouse.PassportNumber)
	add("spouse_travels_with_applicant", string(form.FamilyAndDependants.Spouse.TravelsWithApplicant))
	add("spouse_lives_with_applicant", string(form.FamilyAndDependants.Spouse.LivesWithApplicant))
	add("spouse_residential_address", form.FamilyAndDependants.Spouse.ResidentialAddress)
	add("spouse_residential_country", form.FamilyAndDependants.Spouse.ResidentialCountry)
	add("father_first_name", form.FamilyAndDependants.Father.FirstName)
	add("father_last_name", form.FamilyAndDependants.Father.LastName)
	add("father_birth_date", form.FamilyAndDependants.Father.BirthDate)
	add("father_citizenship", form.FamilyAndDependants.Father.Citizenship)
	add("father_had_single_citizenship", string(form.FamilyAndDependants.Father.HadSingleCitizenship))
	add("father_citizenship_at_applicant_birth", form.FamilyAndDependants.Father.CitizenshipAtApplicantBirth)
	add("mother_first_name", form.FamilyAndDependants.Mother.FirstName)
	add("mother_last_name", form.FamilyAndDependants.Mother.LastName)
	add("mother_birth_date", form.FamilyAndDependants.Mother.BirthDate)
	add("mother_citizenship", form.FamilyAndDependants.Mother.Citizenship)
	add("mother_had_single_citizenship", string(form.FamilyAndDependants.Mother.HadSingleCitizenship))
	add("mother_citizenship_at_applicant_birth", form.FamilyAndDependants.Mother.CitizenshipAtApplicantBirth)
	add("child_has_dependants", string(form.FamilyAndDependants.ChildDependant.HasDependants))
	add("child_full_name", form.FamilyAndDependants.ChildDependant.ChildFullName)
	add("child_birth_date", form.FamilyAndDependants.ChildDependant.ChildBirthDate)
	add("child_birth_place", form.FamilyAndDependants.ChildDependant.ChildBirthPlace)
	add("child_citizenship", form.FamilyAndDependants.ChildDependant.ChildCitizenship)
	add("child_passport_number", form.FamilyAndDependants.ChildDependant.ChildPassportNumber)
	add("child_travels_with_applicant", string(form.FamilyAndDependants.ChildDependant.ChildTravelsWithApplicant))
	add("child_lives_with_applicant", string(form.FamilyAndDependants.ChildDependant.ChildLivesWithApplicant))
	add("child_residential_address", form.FamilyAndDependants.ChildDependant.ChildResidentialAddress)
	add("has_uk_relatives", string(form.FamilyAndDependants.HasUkRelatives))
	add("uk_relatives_relationship", form.FamilyAndDependants.UkRelativesRelationship)
	add("uk_relative_1_full_name", ukRelative1.FullName)
	add("uk_relative_1_citizenship", ukRelative1.Citizenship)
	add("uk_relative_1_stay_basis", ukRelative1.UkStayBasis)
	add("uk_relative_1_passport_or_permit", ukRelative1.PassportOrResidencePermitNumber)
	add("uk_relative_2_full_name", ukRelative2.FullName)
	add("uk_relative_2_citizenship", ukRelative2.Citizenship)
	add("uk_relative_2_stay_basis", ukRelative2.UkStayBasis)
	add("uk_relative_2_passport_or_permit", ukRelative2.PassportOrResidencePermitNumber)

	add("had_uk_visa_before", string(form.TravelHistory.HadUkVisaBefore))
	add("uk_visa_issued_month_year", form.TravelHistory.UkVisaIssuedMonthYear)
	add("uk_visits_last_10_years", form.TravelHistory.UkVisitsLast10Years)
	add("uk_trip_1_purpose", ukTrip1.Purpose)
	add("uk_trip_1_entry_date", ukTrip1.EntryDate)
	add("uk_trip_1_exit_date", ukTrip1.ExitDate)
	add("uk_trip_1_days_stayed", ukTrip1.DaysStayed)
	add("uk_trip_1_country", ukTrip1.Country)
	add("uk_trip_2_purpose", ukTrip2.Purpose)
	add("uk_trip_2_entry_date", ukTrip2.EntryDate)
	add("uk_trip_2_exit_date", ukTrip2.ExitDate)
	add("uk_trip_2_days_stayed", ukTrip2.DaysStayed)
	add("uk_trip_2_country", ukTrip2.Country)
	add("uk_trip_3_purpose", ukTrip3.Purpose)
	add("uk_trip_3_entry_date", ukTrip3.EntryDate)
	add("uk_trip_3_exit_date", ukTrip3.ExitDate)
	add("uk_trip_3_days_stayed", ukTrip3.DaysStayed)
	add("uk_trip_3_country", ukTrip3.Country)
	add("had_uk_visa_refusal", string(form.TravelHistory.HadUkVisaRefusal))
	add("had_uk_entry_refusal", string(form.TravelHistory.HadUkEntryRefusal))
	add("had_uk_deportation", string(form.TravelHistory.HadUkDeportation))
	add("uk_refusal_or_deportation_date", form.TravelHistory.UkRefusalOrDeportationDate)
	add("uk_refusal_or_deportation_reason", form.TravelHistory.UkRefusalOrDeportationReason)
	add("had_other_visa_refusal", string(form.TravelHistory.HadOtherVisaRefusal))
	add("had_other_entry_refusal", string(form.TravelHistory.HadOtherEntryRefusal))
	add("had_other_deportation", string(form.TravelHistory.HadOtherDeportation))
	add("other_refusal_country", form.TravelHistory.OtherRefusalCountry)
	add("other_refusal_or_deportation_date", form.TravelHistory.OtherRefusalOrDeportationDate)
	add("other_refusal_or_deportation_reason", form.TravelHistory.OtherRefusalOrDeportationReason)
	add("traveled_abroad_last_10_years_excluding_uk", string(form.TravelHistory.TraveledAbroadLast10YearsExcludingUk))
	add("major_trip_1_purpose", majorTrip1.Purpose)
	add("major_trip_1_entry_date", majorTrip1.EntryDate)
	add("major_trip_1_exit_date", majorTrip1.ExitDate)
	add("major_trip_1_days_stayed", majorTrip1.DaysStayed)
	add("major_trip_1_country", majorTrip1.Country)
	add("major_trip_2_purpose", majorTrip2.Purpose)
	add("major_trip_2_entry_date", majorTrip2.EntryDate)
	add("major_trip_2_exit_date", majorTrip2.ExitDate)
	add("major_trip_2_days_stayed", majorTrip2.DaysStayed)
	add("major_trip_2_country", majorTrip2.Country)
	add("other_trip_1_purpose", otherTrip1.Purpose)
	add("other_trip_1_entry_date", otherTrip1.EntryDate)
	add("other_trip_1_exit_date", otherTrip1.ExitDate)
	add("other_trip_1_days_stayed", otherTrip1.DaysStayed)
	add("other_trip_1_country", otherTrip1.Country)
	add("other_trip_2_purpose", otherTrip2.Purpose)
	add("other_trip_2_entry_date", otherTrip2.EntryDate)
	add("other_trip_2_exit_date", otherTrip2.ExitDate)
	add("other_trip_2_days_stayed", otherTrip2.DaysStayed)
	add("other_trip_2_country", otherTrip2.Country)
	add("other_trip_3_purpose", otherTrip3.Purpose)
	add("other_trip_3_entry_date", otherTrip3.EntryDate)
	add("other_trip_3_exit_date", otherTrip3.ExitDate)
	add("other_trip_3_days_stayed", otherTrip3.DaysStayed)
	add("other_trip_3_country", otherTrip3.Country)

	add("convicted_criminal_offence", string(form.SecurityAndBackground.ConvictedCriminalOffence))
	add("traffic_offence_penalty", string(form.SecurityAndBackground.TrafficOffencePenalty))
	add("charged_or_awaiting_trial", string(form.SecurityAndBackground.ChargedOrAwaitingTrial))
	add("warning_or_other_penalty", string(form.SecurityAndBackground.WarningOrOtherPenalty))
	add("civil_judgement_or_bankruptcy", string(form.SecurityAndBackground.CivilJudgementOrBankruptcy))
	add("criminal_details", form.SecurityAndBackground.CriminalDetails)
	add("involved_in_war_crimes_or_genocide", string(form.SecurityAndBackground.InvolvedInWarCrimesOrGenocide))
	add("involved_with_terrorist_organization", string(form.SecurityAndBackground.InvolvedWithTerroristOrganization))
	add("expressed_terrorism_support_views", string(form.SecurityAndBackground.ExpressedTerrorismSupportViews))
	add("security_details", form.SecurityAndBackground.SecurityDetails)
	add("worked_in_listed_organizations", string(form.SecurityAndBackground.WorkedInListedOrganizations))
	add("armed_forces_info", form.SecurityAndBackground.ArmedForcesInfo)
	add("government_role_info", form.SecurityAndBackground.GovernmentRoleInfo)
	add("media_role_info", form.SecurityAndBackground.MediaRoleInfo)
	add("security_role_info", form.SecurityAndBackground.SecurityRoleInfo)
	add("administrative_role_info", form.SecurityAndBackground.AdministrativeRoleInfo)
	add("judicial_role_info", form.SecurityAndBackground.JudicialRoleInfo)
	add("additional_information", form.SecurityAndBackground.AdditionalInformation)
	add("biometric_submission_city", form.SecurityAndBackground.BiometricSubmissionCity)

	if len(columns) != len(values) {
		return fmt.Errorf("insert visa application: columns (%d) and values (%d) length mismatch", len(columns), len(values))
	}

	placeholders := make([]string, len(values))
	for i := range placeholders {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
	}

	query := fmt.Sprintf(
		"INSERT INTO form.visa_application (%s) VALUES (%s)",
		strings.Join(columns, ", "),
		strings.Join(placeholders, ", "),
	)

	if _, err := r.db.ExecContext(ctx, query, values...); err != nil {
		return fmt.Errorf("insert visa application: %w", err)
	}

	return nil
}

func (r *Repository) Get(ctx context.Context, id string) (model.SubmitFormRequest, error) {
	rows, err := r.db.QueryxContext(
		ctx,
		`SELECT * FROM form.visa_application WHERE id = $1 LIMIT 1`,
		id,
	)
	if err != nil {
		return model.SubmitFormRequest{}, fmt.Errorf("select visa application: %w", err)
	}
	defer rows.Close()

	if !rows.Next() {
		return model.SubmitFormRequest{}, sql.ErrNoRows
	}

	data := map[string]any{}
	if err := rows.MapScan(data); err != nil {
		return model.SubmitFormRequest{}, fmt.Errorf("scan visa application row: %w", err)
	}

	if err := rows.Err(); err != nil {
		return model.SubmitFormRequest{}, fmt.Errorf("iterate visa application row: %w", err)
	}

	form := model.SubmitFormRequest{
		PersonalDetails: model.PersonalDetails{
			FullNamePassport:           mapString(data, "full_name_passport"),
			OtherNames:                 mapString(data, "other_names"),
			ResidentialAddress:         mapString(data, "residential_address"),
			ResidentialAddressPostCode: mapString(data, "residential_address_postal_code"),
			YearsAtAddress:             mapString(data, "years_at_address"),
			MonthsAtAddress:            mapString(data, "months_at_address"),
			PreviousAddress:            mapString(data, "previous_address"),
			PreviousAddressFrom:        mapString(data, "previous_address_from"),
			PreviousAddressTo:          mapString(data, "previous_address_to"),
			MobilePhone:                mapString(data, "mobile_phone"),
			Email:                      mapString(data, "email"),
			HousingStatus:              mapString(data, "housing_status"),
			HousingStatusDetails:       mapString(data, "housing_status_details"),
			MaritalStatus:              mapString(data, "marital_status"),
			Citizenship:                mapString(data, "citizenship"),
			SecondCitizenshipCountry:   mapString(data, "second_citizenship_country"),
			OtherCitizenshipCountry:    mapString(data, "other_citizenship_country"),
			BirthDate:                  mapString(data, "birth_date"),
			BirthCountry:               mapString(data, "birth_country"),
			BirthPlace:                 mapString(data, "birth_place"),
		},
		PassportDetails: model.PassportDetails{
			CurrentPassportNumber:           mapString(data, "current_passport_number"),
			CurrentPassportIssuingAuthority: mapString(data, "current_passport_issuing_authority"),
			CurrentPassportValidFrom:        mapString(data, "current_passport_valid_from"),
			CurrentPassportValidTo:          mapString(data, "current_passport_valid_to"),
			HasOtherPassport:                toYesNo(mapString(data, "has_other_passport")),
			OtherPassportNumber:             mapString(data, "other_passport_number"),
			OtherPassportIssuingAuthority:   mapString(data, "other_passport_issuing_authority"),
			OtherPassportIssueDate:          mapString(data, "other_passport_issue_date"),
			OtherPassportExpiryDate:         mapString(data, "other_passport_expiry_date"),
			NationalPassportNumber:          mapString(data, "national_passport_number"),
		},
		EmploymentAndFinance: model.EmploymentAndFinance{
			EmploymentStatuses:         splitCSV(mapString(data, "employment_statuses")),
			OrganizationName:           mapString(data, "organization_name"),
			OrganizationAddress:        mapString(data, "organization_address"),
			WorkPhone:                  mapString(data, "work_phone"),
			WorkStartDate:              mapString(data, "work_start_date"),
			Position:                   mapString(data, "position"),
			MonthlyIncomeAfterTax:      mapString(data, "monthly_income_after_tax"),
			WorkDescription:            mapString(data, "work_description"),
			HasOtherIncome:             toYesNo(mapString(data, "has_other_income")),
			OtherIncomeSources:         splitCSV(mapString(data, "other_income_sources")),
			OtherIncomeTotalYear:       mapString(data, "other_income_total_year"),
			HasSavings:                 toYesNo(mapString(data, "has_savings")),
			SavingsBalance:             mapString(data, "savings_balance"),
			MonthlyExpenses:            mapString(data, "monthly_expenses"),
			TripPersonalCost:           mapString(data, "trip_personal_cost"),
			HasTripSponsor:             toYesNo(mapString(data, "has_trip_sponsor")),
			SponsorType:                mapString(data, "sponsor_type"),
			SponsorPersonFullName:      mapString(data, "sponsor_person_full_name"),
			SponsorPersonAddress:       mapString(data, "sponsor_person_address"),
			SponsorPersonAmount:        mapString(data, "sponsor_person_amount"),
			SponsorPersonReason:        mapString(data, "sponsor_person_reason"),
			SponsorEmployerAmount:      mapString(data, "sponsor_employer_amount"),
			SponsorEmployerReason:      mapString(data, "sponsor_employer_reason"),
			SponsorOrganizationName:    mapString(data, "sponsor_organization_name"),
			SponsorOrganizationAddress: mapString(data, "sponsor_organization_address"),
			SponsorOrganizationAmount:  mapString(data, "sponsor_organization_amount"),
			SponsorOrganizationReason:  mapString(data, "sponsor_organization_reason"),
		},
		TripDetails: model.TripDetails{
			ArrivalDateUk:          mapString(data, "arrival_date_uk"),
			DepartureDateUk:        mapString(data, "departure_date_uk"),
			PrimaryPurpose:         mapString(data, "primary_purpose"),
			TravelWithNonDependent: toYesNo(mapString(data, "travel_with_non_dependent")),
			Companion: model.TripCompanion{
				FullName:     mapString(data, "companion_full_name"),
				Citizenship:  mapString(data, "companion_citizenship"),
				Relationship: mapString(data, "companion_relationship"),
			},
			AccommodationType:   mapString(data, "accommodation_type"),
			HotelNameAndAddress: mapString(data, "hotel_name_and_address"),
			RelativeNameAndAddress: mapString(
				data,
				"relative_name_and_address",
			),
			FriendNameAndAddress: mapString(data, "friend_name_and_address"),
			IsBusinessTrip:       toYesNo(mapString(data, "is_business_trip")),
			BusinessTrip: model.BusinessTripDetails{
				InvitingCompanyName:      mapString(data, "business_inviting_company_name"),
				InviterFullName:          mapString(data, "business_inviter_full_name"),
				InvitingCompanyActivity:  mapString(data, "business_inviting_company_activity"),
				InvitingCompanyAddressUk: mapString(data, "business_inviting_company_address_uk"),
				InvitingCompanyPhone:     mapString(data, "business_inviting_company_phone"),
				PlannedBusinessActivities: mapString(
					data,
					"business_planned_activities",
				),
			},
		},
		FamilyAndDependants: model.FamilyAndDependants{
			Spouse: model.SpouseDetails{
				FullName:             mapString(data, "spouse_full_name"),
				Citizenship:          mapString(data, "spouse_citizenship"),
				BirthDate:            mapString(data, "spouse_birth_date"),
				PassportNumber:       mapString(data, "spouse_passport_number"),
				TravelsWithApplicant: toYesNo(mapString(data, "spouse_travels_with_applicant")),
				LivesWithApplicant:   toYesNo(mapString(data, "spouse_lives_with_applicant")),
				ResidentialAddress:   mapString(data, "spouse_residential_address"),
				ResidentialCountry:   mapString(data, "spouse_residential_country"),
			},
			Father: model.ParentDetails{
				FirstName:                   mapString(data, "father_first_name"),
				LastName:                    mapString(data, "father_last_name"),
				BirthDate:                   mapString(data, "father_birth_date"),
				Citizenship:                 mapString(data, "father_citizenship"),
				HadSingleCitizenship:        toYesNo(mapString(data, "father_had_single_citizenship")),
				CitizenshipAtApplicantBirth: mapString(data, "father_citizenship_at_applicant_birth"),
			},
			Mother: model.ParentDetails{
				FirstName:                   mapString(data, "mother_first_name"),
				LastName:                    mapString(data, "mother_last_name"),
				BirthDate:                   mapString(data, "mother_birth_date"),
				Citizenship:                 mapString(data, "mother_citizenship"),
				HadSingleCitizenship:        toYesNo(mapString(data, "mother_had_single_citizenship")),
				CitizenshipAtApplicantBirth: mapString(data, "mother_citizenship_at_applicant_birth"),
			},
			ChildDependant: model.ChildDependant{
				HasDependants:       toYesNo(mapString(data, "child_has_dependants")),
				ChildFullName:       mapString(data, "child_full_name"),
				ChildBirthDate:      mapString(data, "child_birth_date"),
				ChildBirthPlace:     mapString(data, "child_birth_place"),
				ChildCitizenship:    mapString(data, "child_citizenship"),
				ChildPassportNumber: mapString(data, "child_passport_number"),
				ChildTravelsWithApplicant: toYesNo(
					mapString(data, "child_travels_with_applicant"),
				),
				ChildLivesWithApplicant: toYesNo(mapString(data, "child_lives_with_applicant")),
				ChildResidentialAddress: mapString(data, "child_residential_address"),
			},
			HasUkRelatives: toYesNo(mapString(data, "has_uk_relatives")),
			UkRelativesRelationship: mapString(
				data,
				"uk_relatives_relationship",
			),
			UkRelatives: []model.UkRelative{
				{
					FullName:                        mapString(data, "uk_relative_1_full_name"),
					Citizenship:                     mapString(data, "uk_relative_1_citizenship"),
					UkStayBasis:                     mapString(data, "uk_relative_1_stay_basis"),
					PassportOrResidencePermitNumber: mapString(data, "uk_relative_1_passport_or_permit"),
				},
				{
					FullName:                        mapString(data, "uk_relative_2_full_name"),
					Citizenship:                     mapString(data, "uk_relative_2_citizenship"),
					UkStayBasis:                     mapString(data, "uk_relative_2_stay_basis"),
					PassportOrResidencePermitNumber: mapString(data, "uk_relative_2_passport_or_permit"),
				},
			},
		},
		TravelHistory: model.TravelHistory{
			HadUkVisaBefore:       toYesNo(mapString(data, "had_uk_visa_before")),
			UkVisaIssuedMonthYear: mapString(data, "uk_visa_issued_month_year"),
			UkVisitsLast10Years:   mapString(data, "uk_visits_last_10_years"),
			UkTripHistory: []model.TripRecord{
				tripFromRow(data, "uk_trip_1"),
				tripFromRow(data, "uk_trip_2"),
				tripFromRow(data, "uk_trip_3"),
			},
			HadUkVisaRefusal:             toYesNo(mapString(data, "had_uk_visa_refusal")),
			HadUkEntryRefusal:            toYesNo(mapString(data, "had_uk_entry_refusal")),
			HadUkDeportation:             toYesNo(mapString(data, "had_uk_deportation")),
			UkRefusalOrDeportationDate:   mapString(data, "uk_refusal_or_deportation_date"),
			UkRefusalOrDeportationReason: mapString(data, "uk_refusal_or_deportation_reason"),
			HadOtherVisaRefusal:          toYesNo(mapString(data, "had_other_visa_refusal")),
			HadOtherEntryRefusal:         toYesNo(mapString(data, "had_other_entry_refusal")),
			HadOtherDeportation:          toYesNo(mapString(data, "had_other_deportation")),
			OtherRefusalCountry:          mapString(data, "other_refusal_country"),
			OtherRefusalOrDeportationDate: mapString(
				data,
				"other_refusal_or_deportation_date",
			),
			OtherRefusalOrDeportationReason: mapString(
				data,
				"other_refusal_or_deportation_reason",
			),
			TraveledAbroadLast10YearsExcludingUk: toYesNo(
				mapString(data, "traveled_abroad_last_10_years_excluding_uk"),
			),
			MajorCountryTrips: []model.TripRecord{
				tripFromRow(data, "major_trip_1"),
				tripFromRow(data, "major_trip_2"),
			},
			OtherCountryTrips: []model.TripRecord{
				tripFromRow(data, "other_trip_1"),
				tripFromRow(data, "other_trip_2"),
				tripFromRow(data, "other_trip_3"),
			},
		},
		SecurityAndBackground: model.SecurityAndBackground{
			ConvictedCriminalOffence:      toYesNo(mapString(data, "convicted_criminal_offence")),
			TrafficOffencePenalty:         toYesNo(mapString(data, "traffic_offence_penalty")),
			ChargedOrAwaitingTrial:        toYesNo(mapString(data, "charged_or_awaiting_trial")),
			WarningOrOtherPenalty:         toYesNo(mapString(data, "warning_or_other_penalty")),
			CivilJudgementOrBankruptcy:    toYesNo(mapString(data, "civil_judgement_or_bankruptcy")),
			CriminalDetails:               mapString(data, "criminal_details"),
			InvolvedInWarCrimesOrGenocide: toYesNo(mapString(data, "involved_in_war_crimes_or_genocide")),
			InvolvedWithTerroristOrganization: toYesNo(
				mapString(data, "involved_with_terrorist_organization"),
			),
			ExpressedTerrorismSupportViews: toYesNo(
				mapString(data, "expressed_terrorism_support_views"),
			),
			SecurityDetails: mapString(data, "security_details"),
			WorkedInListedOrganizations: toYesNo(
				mapString(data, "worked_in_listed_organizations"),
			),
			ArmedForcesInfo:        mapString(data, "armed_forces_info"),
			GovernmentRoleInfo:     mapString(data, "government_role_info"),
			MediaRoleInfo:          mapString(data, "media_role_info"),
			SecurityRoleInfo:       mapString(data, "security_role_info"),
			AdministrativeRoleInfo: mapString(data, "administrative_role_info"),
			JudicialRoleInfo:       mapString(data, "judicial_role_info"),
			AdditionalInformation:  mapString(data, "additional_information"),
			BiometricSubmissionCity: mapString(
				data,
				"biometric_submission_city",
			),
		},
	}

	return form, nil
}

func relativeAt(relatives []model.UkRelative, idx int) model.UkRelative {
	if idx >= 0 && idx < len(relatives) {
		return relatives[idx]
	}

	return model.UkRelative{}
}

func tripAt(trips []model.TripRecord, idx int) model.TripRecord {
	if idx >= 0 && idx < len(trips) {
		return trips[idx]
	}

	return model.TripRecord{}
}

func mapString(data map[string]any, key string) string {
	value, ok := data[key]
	if !ok || value == nil {
		return ""
	}

	switch typed := value.(type) {
	case string:
		return typed
	case []byte:
		return string(typed)
	default:
		return fmt.Sprint(typed)
	}
}

func toYesNo(value string) model.YesNo {
	normalized := strings.TrimSpace(strings.ToLower(value))
	if normalized == "yes" || normalized == "no" {
		return model.YesNo(normalized)
	}
	return ""
}

func splitCSV(value string) []string {
	if strings.TrimSpace(value) == "" {
		return nil
	}

	rawParts := strings.Split(value, ",")
	parts := make([]string, 0, len(rawParts))
	for _, part := range rawParts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			parts = append(parts, trimmed)
		}
	}

	return parts
}

func tripFromRow(data map[string]any, prefix string) model.TripRecord {
	return model.TripRecord{
		Country:   mapString(data, prefix+"_country"),
		Purpose:   mapString(data, prefix+"_purpose"),
		EntryDate: mapString(data, prefix+"_entry_date"),
		ExitDate:  mapString(data, prefix+"_exit_date"),
		DaysStayed: mapString(
			data,
			prefix+"_days_stayed",
		),
	}
}
