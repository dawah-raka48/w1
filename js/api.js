/* ==========================================
   Weekly Reports System
   API Service
========================================== */

async function api(action, data = {}) {

    const response = await fetch(CONFIG.API_URL, {

        method: "POST",

        body: JSON.stringify({

            action,

            ...data

        })

    });

    return await response.json();

}
