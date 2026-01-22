"use client"

// General
import { IntroSection } from "@/components/design-system/sections/IntroSection"
import { ColorSection } from "@/components/design-system/sections/ColorSection"
import { TypographySection } from "@/components/design-system/sections/TypographySection"

// ShadCN
import { ButtonSection } from "@/components/design-system/sections/ButtonSection"
import { BadgeSection } from "@/components/design-system/sections/BadgeSection"
import { CardSection } from "@/components/design-system/sections/CardSection"
import { InputSection } from "@/components/design-system/sections/InputSection"
import { DialogSection } from "@/components/design-system/sections/DialogSection"
import { SelectSection } from "@/components/design-system/sections/SelectSection"
import { SwitchSection } from "@/components/design-system/sections/SwitchSection"
import { CheckboxSection } from "@/components/design-system/sections/CheckboxSection"
import { DatePickerSection } from "@/components/design-system/sections/DatePickerSection"

// Custom: Layout
import { PageHeaderSection } from "@/components/design-system/sections/PageHeaderSection"
import { SectionHeaderSection } from "@/components/design-system/sections/SectionHeaderSection"

// Custom: Data Display
import { PaginationSection } from "@/components/design-system/sections/PaginationSection"
import { TableSection } from "@/components/design-system/sections/TableSection"
import { StatCardSection } from "@/components/design-system/sections/StatCardSection"

// Custom: Progress
import { LabeledProgressSection } from "@/components/design-system/sections/LabeledProgressSection"

// Custom: Feedback
import { AlertBannerSection } from "@/components/design-system/sections/AlertBannerSection"

// Custom: Form
import { FileDropZoneSection } from "@/components/design-system/sections/FileDropZoneSection"

export default function DesignSystemPage() {
  return (
    <div className="space-y-16">
      {/* ===== General ===== */}
      <IntroSection />

      <hr className="border-border/40" />
      <ColorSection />

      <hr className="border-border/40" />
      <TypographySection />

      {/* ===== ShadCN ===== */}
      <hr className="border-border/40" />
      <ButtonSection />

      <hr className="border-border/40" />
      <BadgeSection />

      <hr className="border-border/40" />
      <CardSection />

      <hr className="border-border/40" />
      <InputSection />

      <hr className="border-border/40" />
      <SelectSection />

      <hr className="border-border/40" />
      <SwitchSection />

      <hr className="border-border/40" />
      <CheckboxSection />

      <hr className="border-border/40" />
      <DatePickerSection />

      <hr className="border-border/40" />
      <DialogSection />

      {/* ===== Custom: Layout ===== */}
      <hr className="border-border/40" />
      <PageHeaderSection />

      <hr className="border-border/40" />
      <SectionHeaderSection />

      {/* ===== Custom: Data Display ===== */}
      <hr className="border-border/40" />
      <TableSection />

      <hr className="border-border/40" />
      <PaginationSection />

      <hr className="border-border/40" />
      <StatCardSection />

      {/* ===== Custom: Progress ===== */}
      <hr className="border-border/40" />
      <LabeledProgressSection />

      {/* ===== Custom: Feedback ===== */}
      <hr className="border-border/40" />
      <AlertBannerSection />

      {/* ===== Custom: Form ===== */}
      <hr className="border-border/40" />
      <FileDropZoneSection />

      <div className="h-20" /> {/* Spacer */}
    </div>
  )
}
