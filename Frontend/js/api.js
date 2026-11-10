(function () {
    "use strict";

    const DEFAULT_BASE_URL = "http://127.0.0.1:8080/api/v1";

    if (!window.NETROUTE_API_BASE_URL) {
        window.NETROUTE_API_BASE_URL = DEFAULT_BASE_URL;
    }

    function getBaseUrl() {
        return String(window.NETROUTE_API_BASE_URL || DEFAULT_BASE_URL)
            .trim()
            .replace(/\/+$/, "");
    }

    async function request(method, path, body) {
        const baseUrl = getBaseUrl();
        const url = baseUrl + "/" + String(path).replace(/^\/+/, "");
        const options = {
            method: method,
            headers: { Accept: "application/json" }
        };

        if (method === "POST") {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(body === undefined ? {} : body);
        }

        let response;

        try {
            response = await fetch(url, options);
        } catch (error) {
            throw new Error(
                "Could not connect to the NETROUTE backend at " + baseUrl + ". " +
                "Check that the backend is running and the address is reachable."
            );
        }

        const responseText = await response.text();
        let data = null;

        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch (error) {
                throw new Error(
                    "The NETROUTE backend returned an invalid JSON response (HTTP " +
                    response.status + ")."
                );
            }
        }

        if (!response.ok) {
            const message = data && (data.error || data.message);
            const err = new Error(
                message
                    ? "Backend request failed (HTTP " + response.status + "): " + message
                    : "Backend request failed with HTTP " + response.status + "."
            );
            err.status = response.status;
            err.data = data;
            err.backendError = message || "";
            throw err;
        }

        return data;
    }

    window.NETROUTE_API = Object.freeze({
        get: function (path) {
            return request("GET", path);
        },
        post: function (path, body) {
            return request("POST", path, body);
        },
        getBaseUrl: getBaseUrl
    });
})();
