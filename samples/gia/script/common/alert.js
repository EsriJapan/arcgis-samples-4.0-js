/**
 * @param {"brand" | "danger" | "info" | "success" | "warning"} kind 
 * @param {アラートのタイトル} title 
 * @param {アラートの概要} message 
 */
export default function displayAlert(kind, title, message) {
    if (kind && title) {
        const calciteShell = document.querySelector("calcite-shell");
        const alert = document.createElement("calcite-alert");
        alert.slot = "alerts"
        alert.label = kind + " message";
        alert.open = true;
        alert.autoClose = true;
        alert.autoCloseDuration = "fast";
        alert.icon = true;
        alert.kind = kind;

        const alertTitle = document.createElement("div");
        alertTitle.slot = "title";
        alertTitle.innerText = title;
        alert.appendChild(alertTitle);
        if (message) {
            const alertMessage = document.createElement("div");
            alertMessage.slot = "message";
            alertMessage.innerText = message;
            alert.appendChild(alertMessage);

            calciteShell.appendChild(alert);
        }

        alert.addEventListener("calciteAlertClose", () => {
            alert.remove();
        });
    }
}