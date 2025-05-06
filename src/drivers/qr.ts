export const generateQR = (data: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Simulate QR code generation
      console.log(`Generating QR code for data: ${data}`);
      
      // In a real implementation, this would generate an actual QR code
      setTimeout(() => {
        resolve(`qr_code_${Date.now()}`);
      }, 500);
    } catch (error) {
      reject(error);
    }
  });
};