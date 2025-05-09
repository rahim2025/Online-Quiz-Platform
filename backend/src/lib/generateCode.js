/**
 * Generates a random alphanumeric code of specified length
 * @param {number} length - Length of the code to generate
 * @returns {string} - Random alphanumeric code
 */
export const generateRandomCode = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  
  return code;
};