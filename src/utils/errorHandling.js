import { toast } from "react-toastify";
import successIcon from "../assets/icons/success.png";
import warningIcon from "../assets/icons/warning.png";
import errorIcon from "../assets/icons/error.png";
import helpIcon from "../assets/icons/help.png";

export const getToast = ({ status, statusType, message }) => {
  /**
   * status : statuscode
   * statusType: success | warning | error | Help
   */
  switch (statusType) {
    case "SUCCESS":
      return toast.success(message, {
        icon: ({ theme, type }) => (
          <img src={successIcon} style={{ width: "1rem", height: "1rem" }} alt={statusType} />
        ),
      });
    case "WARNING":
      return toast.warning(message, {
        icon: ({ theme, type }) => (
          <img src={warningIcon} style={{ width: "1rem", height: "1rem" }} alt={statusType} />
        ),
      });
    case "ERROR":
      console.log("throw toast bro")
      return toast.error(message, {
        icon: ({ theme, type }) => (
          <img src={errorIcon} style={{ width: "1rem", height: "1rem" }} alt={statusType} />
        ),
      });
    case "HELP":
      return toast.info(message, {
        icon: ({ theme, type }) => (
          <img src={helpIcon} style={{ width: "1rem", height: "1rem" }} alt={statusType} />
        ),
      });
    default:
      toast.success(message);
  }
};
export function extractErrorMessage(err) {
    console.log(err);
    if (typeof err === "string") return err;
    let _message = err?.response?.data?.message;
    if (_message) return _message;
  
    _message = err?.message;
    if (_message) return _message;
  
    _message = err?.response?.data?.message;
    if (_message) return _message;
  
    return "Internal Server Error.";
  }
export const throwServerError = (err) => {
  console.log("extracted message :: ",extractErrorMessage(err));
    getToast({
      statusType: "ERROR",
      message: extractErrorMessage(err),
    });
  };