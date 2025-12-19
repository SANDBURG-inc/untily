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

// Custom
import { PageHeaderSection } from "@/components/design-system/sections/PageHeaderSection"
import { PaginationSection } from "@/components/design-system/sections/PaginationSection"
import { TableSection } from "@/components/design-system/sections/TableSection"

export default function DesignSystemPage() {
  return (
    <div className="space-y-16">
      {/* General */}
      <IntroSection />

      <hr className="border-border/40" />
      <ColorSection />

      <hr className="border-border/40" />
      <TypographySection />

      {/* ShadCN */}
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
      <DialogSection />

      {/* Custom */}
      <hr className="border-border/40" />
      <PageHeaderSection />

      <hr className="border-border/40" />
      <PaginationSection />

      <hr className="border-border/40" />
      <TableSection />

      <div className="h-20" /> {/* Spacer */}
    </div>
  )
}
