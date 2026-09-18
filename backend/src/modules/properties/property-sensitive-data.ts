import type { Property } from "../../../generated/prisma/client.js";
import {
  decryptSensitiveText,
  SensitiveDataEncryptionError,
} from "../../common/security/encryption.js";

export function decryptPropertySensitiveData(property: Property) {
  if (!property.exactAddressIv || !property.exactAddressTag) {
    throw new SensitiveDataEncryptionError();
  }

  const exactAddress = decryptSensitiveText(
    property.exactAddressCiphertext,
    property.exactAddressIv,
    property.exactAddressTag,
  );

  let accessInstructions: string | null = null;
  if (property.accessInstructionsCiphertext !== null) {
    if (!property.accessInstructionsIv || !property.accessInstructionsTag) {
      throw new SensitiveDataEncryptionError();
    }
    accessInstructions = decryptSensitiveText(
      property.accessInstructionsCiphertext,
      property.accessInstructionsIv,
      property.accessInstructionsTag,
    );
  }

  return { exactAddress, accessInstructions };
}
