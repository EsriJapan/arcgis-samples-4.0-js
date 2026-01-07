import displayAlert from "./alert.js"
export default async function authorization() {
    const authButton = document.getElementById("auth-button");
    const mapEl = document.getElementById("mapEl");
    const sceneEl = document.getElementById("sceneEl");
    const userField = document.getElementById("userField");
    const avatar = document.querySelector("calcite-avatar");
    const tile = document.querySelector("calcite-tile");
    const [
        esriId,
        OAuthInfo,
        Portal
    ] = await $arcgis.import([
        "@arcgis/core/identity/IdentityManager.js",
        "@arcgis/core/identity/OAuthInfo.js",
        "@arcgis/core/portal/Portal.js"
    ]);

    const oAuthInfo = new OAuthInfo({
        appId: "k7AuRwDMvoWvzWrL",
        popup: true,
        popupCallbackUrl: "./oauth/oauth-callback.html",
        forceUserId: false
    });

    esriId.registerOAuthInfos([oAuthInfo]);

    const portal = new Portal();

    esriId.checkSignInStatus("https://www.arcgis.com").then(credential => {
        esriId.destroyCredentials();
        authButton.icon = "sign-in";
        authButton.innerText = "サイン イン";
        avatar.fullName = "";
        tile.heading = "";
        tile.description = "";
        userField.style.display = "none";
        displayAlert("success", "サイン アウト完了", "サイン アウトしました。");
    }).catch(error => {
        esriId.getCredential("https://www.arcgis.com", { oAuthPopupConfirmation: false }).then(result => {
            if (result) {
                esriId.registerToken({
                    server: "https://www.arcgis.com",
                    token: result.token,
                    userId: result.userId
                });
                authButton.icon = "sign-out";
                authButton.innerText = "サイン アウト";
                displayAlert("success", "サインイン完了", "サインインに成功しました。");
                displayAlert();

                portal.load().then(function () {
                    avatar.fullName = portal.user.fullName;
                    tile.heading = portal.user.fullName;
                    tile.description = portal.user.username;
                    userField.style.display = "block";

                });
            }
        }).catch(error => {
            console.log("error",error)
            displayAlert("warning", "サインイン エラー", "サインインに失敗しました。");
        }).finally(() => {
            return;
        });
    })


    // アプリを離れる際にサインイン情報を削除
    window.addEventListener('beforeunload', function (event) {
        esriId.destroyCredentials();
    });

}
