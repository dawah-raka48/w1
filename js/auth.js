/* ==========================================
   Weekly Reports System
   Authentication
========================================== */

const loginBtn = document.getElementById("loginBtn");
const loginText = document.getElementById("loginText");

const username = document.getElementById("username");
const password = document.getElementById("password");

/* ==========================
   Events
========================== */

loginBtn.addEventListener("click", login);

username.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {

        login();

    }

});

password.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {

        login();

    }

});

/* ==========================
   Login
========================== */

async function login() {

    if (!username.value.trim() || !password.value.trim()) {

        alert("يرجى إدخال اسم المستخدم وكلمة المرور");

        return;

    }

    loginBtn.disabled = true;

    loginText.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        &nbsp;
        جارٍ تسجيل الدخول...
    `;

    const result = await api("login", {

        username: username.value.trim(),

        password: password.value.trim()

    });

    if (!result.success) {

        loginBtn.disabled = false;

        loginText.textContent = "تسجيل الدخول";

        alert(result.message);

        return;

    }

    localStorage.setItem(

        "currentUser",

        JSON.stringify(result.user)

    );

    /* ==========================
       Redirect By Role
    ========================== */

    if (result.user.role === "admin") {

        location.href = "admin.html";

    }

    else if (result.user.role === "manager") {

        location.href = "manager.html";

    }

    else {

        location.href = "employee.html";

    }

}
