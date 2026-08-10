import type { Metadata } from "next";
import { ApplicationForm } from "../forms/ApplicationForm";
import { staffSpec } from "../forms/specs";

export const metadata: Metadata = {
  title: "工作人员报名",
  description: "报名加入创享不打烊幕后团队，让专业技能和年轻创意一起发生。",
};

export default function StaffApplicationPage() {
  return <ApplicationForm spec={staffSpec} />;
}
