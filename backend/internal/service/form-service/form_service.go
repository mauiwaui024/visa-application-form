package form_service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"visa-application-form/backend/internal/model"
	"visa-application-form/backend/internal/repository"
	"visa-application-form/backend/internal/service"
)

type FormService struct {
	repo repository.FormSenderRepository
}

func New(repo repository.FormSenderRepository) service.FormService {
	return &FormService{repo: repo}
}

func (s *FormService) Submit(ctx context.Context, form model.SubmitFormRequest) error {
	if err := validateFormInput(form); err != nil {
		return err
	}

	return s.repo.Save(ctx, form)
}

func (s *FormService) Get(ctx context.Context, id string) (model.SubmitFormRequest, error) {
	if strings.TrimSpace(id) == "" {
		return model.SubmitFormRequest{}, fmt.Errorf("%w: id is required", service.ErrInvalidInput)
	}

	form, err := s.repo.Get(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return model.SubmitFormRequest{}, fmt.Errorf("%w: %s", service.ErrNotFound, id)
		}
		return model.SubmitFormRequest{}, err
	}

	return form, nil
}

func validateFormInput(form model.SubmitFormRequest) error {
	if strings.TrimSpace(form.PersonalDetails.FullNamePassport) == "" {
		return fmt.Errorf("%w: full name is required", service.ErrInvalidInput)
	}

	if strings.TrimSpace(form.PersonalDetails.ResidentialAddress) == "" {
		return fmt.Errorf("%w: residential address is required", service.ErrInvalidInput)
	}

	if strings.TrimSpace(form.PersonalDetails.MobilePhone) == "" {
		return fmt.Errorf("%w: mobile phone is required", service.ErrInvalidInput)
	}

	if strings.TrimSpace(form.PersonalDetails.Email) == "" {
		return fmt.Errorf("%w: email is required", service.ErrInvalidInput)
	}

	if form.PassportDetails.HasOtherPassport == "yes" {
		if strings.TrimSpace(form.PassportDetails.OtherPassportNumber) == "" {
			return fmt.Errorf("%w: other passport number is required", service.ErrInvalidInput)
		}
	}

	if form.EmploymentAndFinance.HasOtherIncome == "yes" {
		if len(form.EmploymentAndFinance.OtherIncomeSources) == 0 {
			return fmt.Errorf("%w: other income sources are required", service.ErrInvalidInput)
		}
		if strings.TrimSpace(form.EmploymentAndFinance.OtherIncomeTotalYear) == "" {
			return fmt.Errorf("%w: yearly other income total is required", service.ErrInvalidInput)
		}
	}

	if form.EmploymentAndFinance.HasSavings == "yes" && strings.TrimSpace(form.EmploymentAndFinance.SavingsBalance) == "" {
		return fmt.Errorf("%w: savings balance is required", service.ErrInvalidInput)
	}

	if form.EmploymentAndFinance.HasTripSponsor == "yes" {
		if strings.TrimSpace(form.EmploymentAndFinance.SponsorType) == "" {
			return fmt.Errorf("%w: sponsor type is required", service.ErrInvalidInput)
		}

		switch form.EmploymentAndFinance.SponsorType {
		case "familyOrFriend":
			if strings.TrimSpace(form.EmploymentAndFinance.SponsorPersonFullName) == "" ||
				strings.TrimSpace(form.EmploymentAndFinance.SponsorPersonAddress) == "" ||
				strings.TrimSpace(form.EmploymentAndFinance.SponsorPersonAmount) == "" ||
				strings.TrimSpace(form.EmploymentAndFinance.SponsorPersonReason) == "" {
				return fmt.Errorf("%w: all family/friend sponsor fields are required", service.ErrInvalidInput)
			}
		case "employer":
			if strings.TrimSpace(form.EmploymentAndFinance.SponsorEmployerAmount) == "" ||
				strings.TrimSpace(form.EmploymentAndFinance.SponsorEmployerReason) == "" {
				return fmt.Errorf("%w: employer sponsor fields are required", service.ErrInvalidInput)
			}
		case "organization":
			if strings.TrimSpace(form.EmploymentAndFinance.SponsorOrganizationName) == "" ||
				strings.TrimSpace(form.EmploymentAndFinance.SponsorOrganizationAddress) == "" ||
				strings.TrimSpace(form.EmploymentAndFinance.SponsorOrganizationAmount) == "" ||
				strings.TrimSpace(form.EmploymentAndFinance.SponsorOrganizationReason) == "" {
				return fmt.Errorf("%w: organization sponsor fields are required", service.ErrInvalidInput)
			}
		}
	}

	if form.TripDetails.TravelWithNonDependent == "yes" {
		if strings.TrimSpace(form.TripDetails.Companion.FullName) == "" ||
			strings.TrimSpace(form.TripDetails.Companion.Citizenship) == "" ||
			strings.TrimSpace(form.TripDetails.Companion.Relationship) == "" {
			return fmt.Errorf("%w: companion fields are required", service.ErrInvalidInput)
		}
	}

	switch form.TripDetails.AccommodationType {
	case "hotel":
		if strings.TrimSpace(form.TripDetails.HotelNameAndAddress) == "" {
			return fmt.Errorf("%w: hotel details are required", service.ErrInvalidInput)
		}
	case "relative":
		if strings.TrimSpace(form.TripDetails.RelativeNameAndAddress) == "" {
			return fmt.Errorf("%w: relative details are required", service.ErrInvalidInput)
		}
	case "friend":
		if strings.TrimSpace(form.TripDetails.FriendNameAndAddress) == "" {
			return fmt.Errorf("%w: friend details are required", service.ErrInvalidInput)
		}
	}

	if strings.EqualFold(strings.TrimSpace(form.TripDetails.PrimaryPurpose), "business") || form.TripDetails.IsBusinessTrip == "yes" {
		if strings.TrimSpace(form.TripDetails.BusinessTrip.InvitingCompanyName) == "" ||
			strings.TrimSpace(form.TripDetails.BusinessTrip.InviterFullName) == "" ||
			strings.TrimSpace(form.TripDetails.BusinessTrip.InvitingCompanyActivity) == "" ||
			strings.TrimSpace(form.TripDetails.BusinessTrip.InvitingCompanyAddressUk) == "" ||
			strings.TrimSpace(form.TripDetails.BusinessTrip.InvitingCompanyPhone) == "" ||
			strings.TrimSpace(form.TripDetails.BusinessTrip.PlannedBusinessActivities) == "" {
			return fmt.Errorf("%w: business trip fields are required", service.ErrInvalidInput)
		}
	}

	if form.FamilyAndDependants.Spouse.LivesWithApplicant == "no" {
		if strings.TrimSpace(form.FamilyAndDependants.Spouse.ResidentialAddress) == "" ||
			strings.TrimSpace(form.FamilyAndDependants.Spouse.ResidentialCountry) == "" {
			return fmt.Errorf("%w: spouse residence fields are required", service.ErrInvalidInput)
		}
	}

	if form.FamilyAndDependants.ChildDependant.HasDependants == "yes" {
		if strings.TrimSpace(form.FamilyAndDependants.ChildDependant.ChildFullName) == "" ||
			strings.TrimSpace(form.FamilyAndDependants.ChildDependant.ChildBirthDate) == "" ||
			strings.TrimSpace(form.FamilyAndDependants.ChildDependant.ChildBirthPlace) == "" ||
			strings.TrimSpace(form.FamilyAndDependants.ChildDependant.ChildCitizenship) == "" ||
			strings.TrimSpace(form.FamilyAndDependants.ChildDependant.ChildPassportNumber) == "" {
			return fmt.Errorf("%w: dependant child fields are required", service.ErrInvalidInput)
		}
		if form.FamilyAndDependants.ChildDependant.ChildLivesWithApplicant == "no" &&
			strings.TrimSpace(form.FamilyAndDependants.ChildDependant.ChildResidentialAddress) == "" {
			return fmt.Errorf("%w: child residence address is required", service.ErrInvalidInput)
		}
	}

	if form.FamilyAndDependants.HasUkRelatives == "yes" {
		if strings.TrimSpace(form.FamilyAndDependants.UkRelativesRelationship) == "" {
			return fmt.Errorf("%w: uk relatives relationship is required", service.ErrInvalidInput)
		}
	}

	if form.TravelHistory.HadUkVisaBefore == "yes" && strings.TrimSpace(form.TravelHistory.UkVisaIssuedMonthYear) == "" {
		return fmt.Errorf("%w: uk visa issue month/year is required", service.ErrInvalidInput)
	}

	if form.TravelHistory.UkVisitsLast10Years != "" && form.TravelHistory.UkVisitsLast10Years != "none" {
		hasTrip := false
		for _, trip := range form.TravelHistory.UkTripHistory {
			if strings.TrimSpace(trip.Purpose) != "" {
				hasTrip = true
				break
			}
		}
		if !hasTrip {
			return fmt.Errorf("%w: at least one uk trip record is required", service.ErrInvalidInput)
		}
	}

	if form.TravelHistory.HadUkVisaRefusal == "yes" || form.TravelHistory.HadUkEntryRefusal == "yes" || form.TravelHistory.HadUkDeportation == "yes" {
		if strings.TrimSpace(form.TravelHistory.UkRefusalOrDeportationDate) == "" ||
			strings.TrimSpace(form.TravelHistory.UkRefusalOrDeportationReason) == "" {
			return fmt.Errorf("%w: uk refusal/deportation details are required", service.ErrInvalidInput)
		}
	}

	if form.TravelHistory.HadOtherVisaRefusal == "yes" || form.TravelHistory.HadOtherEntryRefusal == "yes" || form.TravelHistory.HadOtherDeportation == "yes" {
		if strings.TrimSpace(form.TravelHistory.OtherRefusalCountry) == "" ||
			strings.TrimSpace(form.TravelHistory.OtherRefusalOrDeportationDate) == "" ||
			strings.TrimSpace(form.TravelHistory.OtherRefusalOrDeportationReason) == "" {
			return fmt.Errorf("%w: non-uk refusal/deportation details are required", service.ErrInvalidInput)
		}
	}

	if form.SecurityAndBackground.ConvictedCriminalOffence == "yes" ||
		form.SecurityAndBackground.TrafficOffencePenalty == "yes" ||
		form.SecurityAndBackground.ChargedOrAwaitingTrial == "yes" ||
		form.SecurityAndBackground.WarningOrOtherPenalty == "yes" ||
		form.SecurityAndBackground.CivilJudgementOrBankruptcy == "yes" {
		if strings.TrimSpace(form.SecurityAndBackground.CriminalDetails) == "" {
			return fmt.Errorf("%w: criminal details are required", service.ErrInvalidInput)
		}
	}

	if form.SecurityAndBackground.InvolvedInWarCrimesOrGenocide == "yes" ||
		form.SecurityAndBackground.InvolvedWithTerroristOrganization == "yes" ||
		form.SecurityAndBackground.ExpressedTerrorismSupportViews == "yes" {
		if strings.TrimSpace(form.SecurityAndBackground.SecurityDetails) == "" {
			return fmt.Errorf("%w: security details are required", service.ErrInvalidInput)
		}
	}

	if form.SecurityAndBackground.WorkedInListedOrganizations == "yes" {
		if strings.TrimSpace(form.SecurityAndBackground.ArmedForcesInfo) == "" &&
			strings.TrimSpace(form.SecurityAndBackground.GovernmentRoleInfo) == "" &&
			strings.TrimSpace(form.SecurityAndBackground.MediaRoleInfo) == "" &&
			strings.TrimSpace(form.SecurityAndBackground.SecurityRoleInfo) == "" &&
			strings.TrimSpace(form.SecurityAndBackground.AdministrativeRoleInfo) == "" &&
			strings.TrimSpace(form.SecurityAndBackground.JudicialRoleInfo) == "" {
			return fmt.Errorf("%w: at least one organization detail is required", service.ErrInvalidInput)
		}
	}

	if strings.TrimSpace(form.SecurityAndBackground.BiometricSubmissionCity) == "" {
		return fmt.Errorf("%w: biometric submission city is required", service.ErrInvalidInput)
	}

	return nil
}
