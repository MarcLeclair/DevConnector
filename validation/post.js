const Validator = require('validator');
const isEmpty = require('./is-empty');
module.exports = function validatePostInput(data) {
  let errors = {};

  data.text = !isEmpty(data.text) ? data.text : '';
  
   if (!Validator.isLength(data.text, {min: 10, max: 300})) {
    errors.text = 'post length is invalid. Must between 10 and 300';
  }

  if (Validator.isEmpty(data.text)) {
    errors.text = 'text is invalid';
  }
 
 return {
    errors,
    isValid: isEmpty(errors)
  };
};
