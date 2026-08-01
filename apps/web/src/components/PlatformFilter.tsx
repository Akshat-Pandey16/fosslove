import type { ComponentType } from "react";
import { PLATFORMS, type Platform } from "@/api/types";
import { platformLabel } from "@/lib/hues";
import {
  LinuxIcon,
  SegmentedControl,
  WindowsIcon,
  type IconProps,
  type SegmentOption,
} from "@/ui";

const PLATFORM_ICONS: Record<Platform, ComponentType<IconProps>> = {
  windows: WindowsIcon,
  linux: LinuxIcon,
};

export function PlatformFilter({
  value,
  onChange,
  includeAll = false,
  name = "Platform",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  includeAll?: boolean | undefined;
  name?: string | undefined;
  className?: string | undefined;
}) {
  const options: SegmentOption<string>[] = [
    ...(includeAll ? [{ value: "", label: "All" }] : []),
    ...PLATFORMS.map((platform) => {
      const Icon = PLATFORM_ICONS[platform];
      return { value: platform, label: platformLabel(platform), icon: <Icon size={15} /> };
    }),
  ];

  return (
    <SegmentedControl
      options={options}
      value={value}
      onChange={onChange}
      name={name}
      className={className}
    />
  );
}
