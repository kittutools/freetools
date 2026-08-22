// Kittutools - Ultimate Password Generator (js/password-generator.js)

function openPasswordGeneratorModal() {
    openModal('password-generator-modal');
    generatePassword();
}

function closePasswordGeneratorModal() {
    closeModal('password-generator-modal');
}

function updatePasswordLengthLabel(val) {
    document.getElementById('pwd-length-val').textContent = val;
    generatePassword();
}

function generatePassword() {
    const length = parseInt(document.getElementById('pwd-length-slider').value, 10) || 16;
    const includeUpper = document.getElementById('pwd-inc-upper').checked;
    const includeLower = document.getElementById('pwd-inc-lower').checked;
    const includeNum = document.getElementById('pwd-inc-num').checked;
    const includeSym = document.getElementById('pwd-inc-sym').checked;
    const excludeSimilar = document.getElementById('pwd-exc-similar').checked;

    let upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let lowerChars = "abcdefghijklmnopqrstuvwxyz";
    let numChars = "0123456789";
    let symChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (excludeSimilar) {
        // Exclude i, l, 1, L, o, 0, O
        upperChars = upperChars.replace(/[L|O]/g, '');
        lowerChars = lowerChars.replace(/[i|l|o]/g, '');
        numChars = numChars.replace(/[1|0]/g, '');
    }

    let charPool = "";
    const pools = [];
    if (includeUpper) { charPool += upperChars; pools.push(upperChars); }
    if (includeLower) { charPool += lowerChars; pools.push(lowerChars); }
    if (includeNum) { charPool += numChars; pools.push(numChars); }
    if (includeSym) { charPool += symChars; pools.push(symChars); }

    const displayInput = document.getElementById('pwd-display-output');

    if (charPool.length === 0) {
        displayInput.value = "Select at least 1 option";
        evaluateStrength("");
        return;
    }

    // Cryptographically secure random generation
    function getRandomChar(str) {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        return str[array[0] % str.length];
    }

    let password = "";
    // Ensure at least one character from each selected pool
    pools.forEach(pool => {
        if (pool.length > 0) {
            password += getRandomChar(pool);
        }
    });

    while (password.length < length) {
        password += getRandomChar(charPool);
    }

    // Shuffle password using Fisher-Yates
    const pwdArr = password.split('');
    for (let i = pwdArr.length - 1; i > 0; i--) {
        const randArr = new Uint32Array(1);
        window.crypto.getRandomValues(randArr);
        const j = randArr[0] % (i + 1);
        [pwdArr[i], pwdArr[j]] = [pwdArr[j], pwdArr[i]];
    }
    password = pwdArr.join('');

    displayInput.value = password;
    evaluateStrength(password);
}

function evaluateStrength(pwd) {
    const strengthMeter = document.getElementById('pwd-strength-bar');
    const strengthLabel = document.getElementById('pwd-strength-label');

    if (!pwd || pwd === "Select at least 1 option") {
        strengthMeter.style.width = '0%';
        strengthMeter.className = 'h-2 rounded-full transition-all duration-300 bg-neutral-700';
        strengthLabel.textContent = 'None';
        strengthLabel.className = 'text-xs font-bold text-neutral-400';
        return;
    }

    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (pwd.length >= 18) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 3) {
        strengthMeter.style.width = '33%';
        strengthMeter.className = 'h-2 rounded-full transition-all duration-300 bg-red-500';
        strengthLabel.textContent = 'Weak';
        strengthLabel.className = 'text-xs font-bold text-red-500';
    } else if (score <= 5) {
        strengthMeter.style.width = '66%';
        strengthMeter.className = 'h-2 rounded-full transition-all duration-300 bg-yellow-500';
        strengthLabel.textContent = 'Medium';
        strengthLabel.className = 'text-xs font-bold text-yellow-500';
    } else {
        strengthMeter.style.width = '100%';
        strengthMeter.className = 'h-2 rounded-full transition-all duration-300 bg-emerald-500';
        strengthLabel.textContent = 'Strong';
        strengthLabel.className = 'text-xs font-bold text-emerald-500';
    }
}

function copyAndGeneratePassword() {
    const displayInput = document.getElementById('pwd-display-output');
    if (!displayInput.value || displayInput.value === "Select at least 1 option") return;

    navigator.clipboard.writeText(displayInput.value).then(() => {
        if (window.showToast) {
            showToast('Password copied to clipboard!', 'success');
        }
    });

    generatePassword();
}
