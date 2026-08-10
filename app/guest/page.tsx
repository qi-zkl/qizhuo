import type { Metadata } from "next";
import { ApplicationForm } from "../forms/ApplicationForm";
import { guestSpec } from "../forms/specs";

export const metadata: Metadata = {
  title: "出演嘉宾报名",
  description: "报名加入创享不打烊，成为镜头前真实、有趣、敢表达的出演嘉宾。",
};

export default function GuestApplicationPage() {
  return <ApplicationForm spec={guestSpec} />;
}
