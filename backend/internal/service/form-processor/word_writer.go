package form_processor

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"visa-application-form/backend/internal/model"
)

func writeFormRTF(outputDir, id string, form model.SubmitFormRequest) (string, error) {
	if strings.TrimSpace(outputDir) == "" {
		outputDir = "./generated-forms"
	}

	if err := os.MkdirAll(outputDir, 0o755); err != nil {
		return "", fmt.Errorf("create output dir: %w", err)
	}

	filename := fmt.Sprintf(
		"visa_application_%s_%s.rtf",
		id,
		time.Now().Format("20060102_150405"),
	)
	path := filepath.Join(outputDir, filename)

	content := buildFormRTF(form)
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		return "", fmt.Errorf("write rtf file: %w", err)
	}

	return path, nil
}

func buildFormRTF(form model.SubmitFormRequest) string {
	var b strings.Builder
	b.WriteString("{\\rtf1\\ansi\\ansicpg1251\\uc1\\deff0\n")
	b.WriteString("{\\fonttbl{\\f0\\fnil\\fcharset204 Arial;}}\n")
	b.WriteString("\\fs22\n")
	writeTitle(&b, "ОПРОСНЫЙ ЛИСТ")

	writeSection(&b, "Личные данные")
	writeQ(&b, "1. Фамилия, имя, отчество", form.PersonalDetails.FullNamePassport)
	writeQ(&b, "2. Другие имена/фамилии", form.PersonalDetails.OtherNames)
	writeQ(&b, "3. Фактический адрес проживания", form.PersonalDetails.ResidentialAddress)
	writeQ(&b, "3.1 Индекс", form.PersonalDetails.ResidentialAddressPostCode)
	writeQ(&b, "4. Срок проживания (лет)", form.PersonalDetails.YearsAtAddress)
	writeQ(&b, "4. Срок проживания (месяцев)", form.PersonalDetails.MonthsAtAddress)
	writeQ(&b, "4.1 Предыдущий адрес", form.PersonalDetails.PreviousAddress)
	writeQ(&b, "5. Мобильный телефон", form.PersonalDetails.MobilePhone)
	writeQ(&b, "5.1 Email", form.PersonalDetails.Email)
	writeQ(&b, "7. Семейное положение", form.PersonalDetails.MaritalStatus)
	writeQ(&b, "8. Гражданство", form.PersonalDetails.Citizenship)
	writeQ(&b, "9. Дата рождения", form.PersonalDetails.BirthDate)
	writeQ(&b, "10. Страна рождения", form.PersonalDetails.BirthCountry)
	writeQ(&b, "11. Место рождения", form.PersonalDetails.BirthPlace)

	writeSection(&b, "Паспортные данные")
	writeQ(&b, "12. Номер загранпаспорта", form.PassportDetails.CurrentPassportNumber)
	writeQ(&b, "13. Орган выдачи", form.PassportDetails.CurrentPassportIssuingAuthority)
	writeQ(&b, "14. Срок действия до", form.PassportDetails.CurrentPassportValidTo)
	writeQ(&b, "15. Есть ли другой паспорт", string(form.PassportDetails.HasOtherPassport))
	writeQ(&b, "16. Номер второго паспорта", form.PassportDetails.OtherPassportNumber)

	writeSection(&b, "Работа и финансы")
	writeQ(&b, "18. Статусы занятости", strings.Join(form.EmploymentAndFinance.EmploymentStatuses, ", "))
	writeQ(&b, "19. Название организации", form.EmploymentAndFinance.OrganizationName)
	writeQ(&b, "20. Адрес организации", form.EmploymentAndFinance.OrganizationAddress)
	writeQ(&b, "21. Рабочий телефон", form.EmploymentAndFinance.WorkPhone)
	writeQ(&b, "24. Доход после налогов", form.EmploymentAndFinance.MonthlyIncomeAfterTax)
	writeQ(&b, "26. Есть другие доходы", string(form.EmploymentAndFinance.HasOtherIncome))
	writeQ(&b, "27. Есть сбережения", string(form.EmploymentAndFinance.HasSavings))
	writeQ(&b, "30. Стоимость поездки", form.EmploymentAndFinance.TripPersonalCost)
	writeQ(&b, "31. Есть спонсор поездки", string(form.EmploymentAndFinance.HasTripSponsor))

	writeSection(&b, "Поездка в Великобританию")
	writeQ(&b, "33. Дата въезда", form.TripDetails.ArrivalDateUk)
	writeQ(&b, "34. Дата выезда", form.TripDetails.DepartureDateUk)
	writeQ(&b, "35. Цель поездки", form.TripDetails.PrimaryPurpose)
	writeQ(&b, "36. Путешествуете не один", string(form.TripDetails.TravelWithNonDependent))
	writeQ(&b, "37. Тип размещения", form.TripDetails.AccommodationType)

	writeSection(&b, "Семья и иждивенцы")
	writeQ(&b, "48. Супруг/а ФИО", form.FamilyAndDependants.Spouse.FullName)
	writeQ(&b, "55. Отец имя", form.FamilyAndDependants.Father.FirstName)
	writeQ(&b, "61. Мать имя", form.FamilyAndDependants.Mother.FirstName)
	writeQ(&b, "68. Есть дети-иждивенцы", string(form.FamilyAndDependants.ChildDependant.HasDependants))
	writeQ(&b, "78. Есть родственники в UK", string(form.FamilyAndDependants.HasUkRelatives))

	writeSection(&b, "История поездок")
	writeQ(&b, "81. Была виза UK ранее", string(form.TravelHistory.HadUkVisaBefore))
	writeQ(&b, "82. Визиты в UK за 10 лет", form.TravelHistory.UkVisitsLast10Years)
	writeTrips(&b, "83. Поездки в UK", form.TravelHistory.UkTripHistory)
	writeQ(&b, "86. Поездки за границу (кроме UK)", string(form.TravelHistory.TraveledAbroadLast10YearsExcludingUk))
	writeTrips(&b, "87. Крупные страны", form.TravelHistory.MajorCountryTrips)
	writeTrips(&b, "87. Другие страны", form.TravelHistory.OtherCountryTrips)

	writeSection(&b, "Судимость и безопасность")
	writeQ(&b, "88.1 Судимость", string(form.SecurityAndBackground.ConvictedCriminalOffence))
	writeQ(&b, "89.1 Причастность к военным преступлениям", string(form.SecurityAndBackground.InvolvedInWarCrimesOrGenocide))
	writeQ(&b, "90. Работа в перечисленных организациях", string(form.SecurityAndBackground.WorkedInListedOrganizations))
	writeQ(&b, "91. Доп. информация", form.SecurityAndBackground.AdditionalInformation)
	writeQ(&b, "92. Город сдачи биометрии", form.SecurityAndBackground.BiometricSubmissionCity)

	b.WriteString("}\n")
	return b.String()
}

func writeTitle(b *strings.Builder, text string) {
	b.WriteString("\\b\\fs28 ")
	b.WriteString(rtfEscape(text))
	b.WriteString("\\b0\\fs22\\par\\par\n")
}

func writeSection(b *strings.Builder, title string) {
	b.WriteString("\\b ")
	b.WriteString(rtfEscape(title))
	b.WriteString("\\b0\\par\n")
}

func writeQ(b *strings.Builder, label string, value string) {
	if strings.TrimSpace(value) == "" {
		value = "-"
	}
	b.WriteString(rtfEscape(label))
	b.WriteString(": ")
	b.WriteString(rtfEscape(value))
	b.WriteString("\\par\n")
}

func writeTrips(b *strings.Builder, title string, trips []model.TripRecord) {
	b.WriteString(rtfEscape(title))
	b.WriteString(":\\par\n")
	if len(trips) == 0 {
		b.WriteString("-\\par\n")
		return
	}

	for i, trip := range trips {
		if strings.TrimSpace(trip.Country) == "" &&
			strings.TrimSpace(trip.Purpose) == "" &&
			strings.TrimSpace(trip.EntryDate) == "" &&
			strings.TrimSpace(trip.ExitDate) == "" &&
			strings.TrimSpace(trip.DaysStayed) == "" {
			continue
		}
		line := fmt.Sprintf(
			"%d) %s; цель: %s; въезд: %s; выезд: %s; дней: %s",
			i+1,
			trip.Country,
			trip.Purpose,
			trip.EntryDate,
			trip.ExitDate,
			trip.DaysStayed,
		)
		b.WriteString(rtfEscape(line))
		b.WriteString("\\par\n")
	}
}

func rtfEscape(value string) string {
	var b strings.Builder
	for _, r := range value {
		switch r {
		case '\\':
			b.WriteString("\\\\")
		case '{':
			b.WriteString("\\{")
		case '}':
			b.WriteString("\\}")
		case '\n':
			b.WriteString("\\line ")
		default:
			if r <= 127 {
				b.WriteRune(r)
				continue
			}

			// RTF unicode escape: \uN? where N is signed 16-bit.
			n := int32(r)
			if n > 32767 {
				n -= 65536
			}
			b.WriteString(fmt.Sprintf("\\u%d?", n))
		}
	}
	return b.String()
}
