const PNR_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePnr(length = 6): string {
  let code = "";

  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * PNR_CHARS.length);
    code += PNR_CHARS[index];
  }

  return code;
}

