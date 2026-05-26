import { postJson } from "../../../shared/api/client";
import type { SubmitFormRequest, SubmitFormResponse } from "../model/types";

export async function submitForm(
  payload: SubmitFormRequest,
): Promise<SubmitFormResponse> {
  return postJson<SubmitFormResponse>("/api/v1/form", payload);
}
