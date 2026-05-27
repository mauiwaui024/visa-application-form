import { postJson } from "../../../shared/api/client";
import type { SubmitFormRequest, SubmitFormResponse } from "../model/types";

export async function submitForm(
  payload: SubmitFormRequest,
): Promise<SubmitFormResponse> {
  return postJson<SubmitFormResponse>("/v1/form", payload);
}
