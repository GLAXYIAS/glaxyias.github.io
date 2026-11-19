/**
 * Centralized error handler for Playsaurus network errors.
 *
 * Error Hierarchy (from SDK docs):
 * PlaysaurusNetworkError (base)
 * ├── PlaysaurusUnauthorizedError (401)
 * ├── PlaysaurusForbiddenError (403)
 * │   └── PlaysaurusEmailNotVerifiedError (403 + auth:email-not-verified)
 * ├── PlausaurusConflictError (409)
 * │   ├── PlaysaurusClientOutdatedError (409 + client:outdated)
 * │   └── PlaysaurusRewardIncompatibleError (409 + reward:incompatible)
 * ├── PlaysaurusValidationError (422)
 * ├── PlaysaurusTooManyRequestsError (429)
 * └── PlaysaurusMaintenanceError (503)
 */
class PlaysaurusErrorHandler {
    _isShowingAlert = false;

    /**
     * Wraps alert() to set/clear the _isShowingAlert guard automatically.
     */
    _alert(message, onOk) {
        this._isShowingAlert = true;
        alert(message, () => {
            this._isShowingAlert = false;
            if (onOk) onOk();
        });
    }

    /**
     * Handles Playsaurus network errors and displays appropriate error messages to the user.
     * @param {Playsaurus.PlaysaurusNetworkError} error - The error to handle
     */
    handle(error) {
        // Log error for debugging
        console.error(`${error.constructor.name}: ${error.message}`);

        // Don't stack error popups — if one is already showing, swallow subsequent errors silently.
        if (this._isShowingAlert) return;

        // Handle specific error types first (most specific to least specific)

        // SDK v12: Client version too old (HTTP 409)
        if (error instanceof Playsaurus.PlaysaurusClientOutdatedError) {
            const message = error.localizedDisplayMessage || "Please update your game to continue.";
            this._alert(message);
            return;
        }

        // SDK v12: Coupon reward type not supported by this game version (HTTP 409)
        if (error instanceof Playsaurus.PlaysaurusRewardIncompatibleError) {
            const message = error.localizedDisplayMessage || "Please update your game to redeem this coupon.";
            this._alert(message);
            return;
        }

        // SDK v12: User's email not verified (HTTP 403)
        if (error instanceof Playsaurus.PlaysaurusEmailNotVerifiedError) {
            const message = error.localizedDisplayMessage || "Please verify your email address to continue.";
            this._alert(message);
            return;
        }

        // Validation errors (HTTP 422) - form input problems
        if (error instanceof Playsaurus.PlaysaurusValidationError) {
            this._handleValidationError(error);
            return;
        }

        // Session expired or not logged in (HTTP 401)
        if (error instanceof Playsaurus.PlaysaurusUnauthorizedError) {
            this._alert("Your session has expired. Please log in again.", () => playsaurusSdk.startLogin());
            return;
        }

        // Base conflict error (HTTP 409) - catch any conflict errors not handled above
        if (error instanceof Playsaurus.PlaysaurusConflictError) {
            const message = error.localizedDisplayMessage || "A conflict occurred. Please try again.";
            this._alert(message);
            return;
        }

        // Permission denied (HTTP 403)
        if (error instanceof Playsaurus.PlaysaurusForbiddenError) {
            const message = error.localizedDisplayMessage || "You don't have permission to perform this action.";
            this._alert(message);
            return;
        }

        // Rate limiting (HTTP 429)
        if (error instanceof Playsaurus.PlaysaurusTooManyRequestsError) {
            this._alert("You are trying too often! Please wait a moment before trying again.");
            return;
        }

        // Server maintenance (HTTP 503)
        if (error instanceof Playsaurus.PlaysaurusMaintenanceError) {
            const message = error.localizedDisplayMessage || "Sorry, our servers are currently down for maintenance. Please try again in a few seconds.";
            this._alert(message);
            return;
        }

        // Default: Unknown PlaysaurusNetworkError
        const message = error.localizedDisplayMessage || "An unexpected error occurred. Please try again later.";
        this._alert(message);
    }

    /**
     * Handles validation errors with support for field-specific error messages.
     * @param {Playsaurus.PlaysaurusValidationError} error - The validation error
     */
    _handleValidationError(error) {
        // Log field-specific errors for debugging
        if (error.errors) {
            for (const [field, messages] of Object.entries(error.errors)) {
                console.error(`Validation error [${field}]: ${messages.join(' ')}`);
            }
        }

        // Display the summary message to the user
        const message = error.localizedDisplayMessage || "There are problems with your input. Please check the fields and try again.";
        this._alert(message);

        // Note: If you have form UI that supports per-field errors, you can use error.errors
        // to display specific messages under each field. The keys are in snake_case format.
        // Example:
        // for (const [field, messages] of Object.entries(error.errors)) {
        //     MyFormUI.findFieldByName(field).setError(messages[0]);
        // }
    }
}

// Create a singleton instance for convenience
var playsaurusErrorHandler = new PlaysaurusErrorHandler();
