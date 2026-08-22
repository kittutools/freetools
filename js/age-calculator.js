// Kittutools - Exact Age Calculator (js/age-calculator.js)

function openAgeCalculatorModal() {
    openModal('age-calculator-modal');

    const todayStr = new Date().toISOString().split('T')[0];
    const targetInput = document.getElementById('age-target-date');
    if (!targetInput.value) {
        targetInput.value = todayStr;
    }

    const dobInput = document.getElementById('age-dob-date');
    if (!dobInput.value) {
        dobInput.value = '2000-01-01';
    }

    calculateExactAge();
}

function closeAgeCalculatorModal() {
    closeModal('age-calculator-modal');
}

function calculateExactAge() {
    const dobVal = document.getElementById('age-dob-date').value;
    const targetVal = document.getElementById('age-target-date').value;

    if (!dobVal || !targetVal) return;

    const dob = new Date(dobVal + 'T00:00:00');
    const target = new Date(targetVal + 'T00:00:00');

    if (isNaN(dob.getTime()) || isNaN(target.getTime())) return;

    if (target < dob) {
        document.getElementById('age-years').textContent = '0';
        document.getElementById('age-months').textContent = '0';
        document.getElementById('age-days').textContent = '0';
        document.getElementById('age-total-weeks').textContent = '0';
        document.getElementById('age-total-days').textContent = '0';
        document.getElementById('age-total-hours').textContent = '0';
        document.getElementById('age-next-bday').textContent = '0';
        return;
    }

    let years = target.getFullYear() - dob.getFullYear();
    let months = target.getMonth() - dob.getMonth();
    let days = target.getDate() - dob.getDate();

    if (days < 0) {
        months--;
        const prevMonthDate = new Date(target.getFullYear(), target.getMonth(), 0);
        days += prevMonthDate.getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    // Total stats
    const diffTime = target.getTime() - dob.getTime();
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalHours = totalDays * 24;

    // Next Birthday calculation
    let nextBday = new Date(target.getFullYear(), dob.getMonth(), dob.getDate());
    if (nextBday < target) {
        nextBday.setFullYear(target.getFullYear() + 1);
    }
    const daysToBday = Math.ceil((nextBday.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

    // Update UI
    document.getElementById('age-years').textContent = years;
    document.getElementById('age-months').textContent = months;
    document.getElementById('age-days').textContent = days;

    document.getElementById('age-total-weeks').textContent = totalWeeks.toLocaleString();
    document.getElementById('age-total-days').textContent = totalDays.toLocaleString();
    document.getElementById('age-total-hours').textContent = totalHours.toLocaleString();
    document.getElementById('age-next-bday').textContent = daysToBday;
}
