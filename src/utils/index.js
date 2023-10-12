import { toast } from "react-toastify";
import { throwServerError } from "./errorHandling";
import JSEncrypt from "jsencrypt";

export function getEnv(name) {
    const url = window.env[name] || process.env[name];
    return url;
  }

  export const errorCallback = (error) => {
    const { response } = error;
    console.log(response, "error thrown");
    if (response.status === 403) {
      toast.error(`${response.data.message}, UnAuthorised Access`, {autoClose: 2500});
      localStorage.removeItem('wizforce-token')
      window.location.href = "/login";
    }
    if (response.status === 402) {
      toast.error('Invite Link Expired');
      window.location.href = "/expired";
    }
    else if(response.status === 404){
      window.location.href = "/notfound";    
    }
    else if(response.status === 500 || response.status === 400){
      console.log(response, "error thrown");
      throwServerError(error)
    }else if(response.status === 401){
      console.log(response, "error thrown")
      throwServerError(error)
    }
    return response
};

export const convertValueIntoLabel = (str) => {
  return capitalizeFirstLetters(str.split("_").join(" "))
}


export const capitalizeFirstLetters = (inputString) => {
  return inputString.replace(/\b\w+/g, function(match) {
    return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
  });
}

export const asyncLocalStorage = {
  async setItem(key, value) {
      await null;
      return localStorage.setItem(key, value);
  },
  async getItem(key) {
      await null;
      return localStorage.getItem(key);
  }
};

export const encrypt = (password) => {
  const encrypt = new JSEncrypt({});
  encrypt.setPublicKey(getEnv("PUBLIC_KEY"));
  return encrypt.encrypt(password);
};

export const passwordRegex = /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[@$!%*~`;:><,/."'?&#^)(+=\-_}{[\]])[a-zA-Z\d@$#+=^()|`~.><,/:;"'!%*?&\-_}{[\]^()]{6,}$/;
export const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
export const urlRegex =  new RegExp(
  '^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', // fragment locator
  'i'
);

export const extractContacts = (data) => {
  const contactsArray = [];
  let linkedCustomerName = "";

  function extractFromCustomers(customers) {
    for (const customer of customers) {
      linkedCustomerName = customer.userValues.find(userValue => userValue.labelName === "Customer Name").fieldValue;
      for(let contact of customer.contacts){
          contact.linkedCustomerName = linkedCustomerName;
          contactsArray.push(contact)
          console.log(contactsArray, "CONTACTS ARRAY");
      }
    }
  }

  if (data.data && Array.isArray(data.data)) {
    for (const item of data.data) {
      if (item.customers && Array.isArray(item.customers)) {
        extractFromCustomers(item.customers);
      }
    }
  }

  return contactsArray;
}

export function objectDeepClone(obj) {
  try {
      return JSON.parse(JSON.stringify(obj));
  } catch (error) {
      return obj;
  }
}

export const arraysAreEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  return true;
}

export const countKeysWithDifferentValues = (obj1, obj2) => {
  let count = 0;
console.log("krystal",obj1, obj2)
  for (const key in obj1) {
      console.log(key, "kejeje");
    if (obj1.hasOwnProperty(key) && obj2.hasOwnProperty(key)) {
      if (Array.isArray(obj1[key]) && Array.isArray(obj2[key])) {
          // If both values are arrays, compare them element by element
          if (!arraysAreEqual(obj1[key], obj2[key])) {
            count++;
          }
        } else if (obj1[key] !== obj2[key]) {
          // If values are not arrays, compare them directly
          count++;
        }
    }
  }

  return count;
}