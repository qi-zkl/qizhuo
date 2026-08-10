import { handleApplication } from "../_shared";

export async function POST(request: Request) {
  return handleApplication(request, "guest");
}
