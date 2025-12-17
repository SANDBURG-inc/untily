"use client"

import { IntroSection } from "@/components/design-system/sections/IntroSection"
import { ColorSection } from "@/components/design-system/sections/ColorSection"
import { TypographySection } from "@/components/design-system/sections/TypographySection"
import { ButtonSection } from "@/components/design-system/sections/ButtonSection"
import { CardSection } from "@/components/design-system/sections/CardSection"
import { InputSection } from "@/components/design-system/sections/InputSection"

export default function DesignSystemPage() {
  return (
    <div className="space-y-16">
      <IntroSection />
      
      <hr className="border-border/40" />
      <ColorSection />
      
      <hr className="border-border/40" />
      <TypographySection />
      
      <hr className="border-border/40" />
      <ButtonSection />
      
      <hr className="border-border/40" />
      <CardSection />
      
      <hr className="border-border/40" />
      <InputSection />

      <div className="h-20" /> {/* Spacer */}
    </div>
  )
}
