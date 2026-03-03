"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react"
import {
  CheckIcon,
  ChevronDownIcon,
  XIcon,
  SearchIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

const Combobox = ComboboxPrimitive.Root

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />
}

function ComboboxTrigger({
  className,
  children,
  hideIcon = false,
  icon,
  ...props
}: ComboboxPrimitive.Trigger.Props & {
  hideIcon?: boolean
  icon?: React.ReactNode
}) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn("[&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      {children}
      {!hideIcon &&
        (icon ?? (
          <ChevronDownIcon
            data-slot="combobox-trigger-icon"
            className="text-muted-foreground pointer-events-none size-4"
          />
        ))}
    </ComboboxPrimitive.Trigger>
  )
}

function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      render={<InputGroupButton variant="ghost" size="icon-xs" />}
      className={cn(className)}
      {...props}
    >
      <XIcon className="pointer-events-none" />
    </ComboboxPrimitive.Clear>
  )
}

function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: ComboboxPrimitive.Input.Props & {
  showTrigger?: boolean
  showClear?: boolean
}) {
  return (
    <InputGroup className={cn("w-auto", className)} data-slot="input-group">
      <ComboboxPrimitive.Input
        render={<InputGroupInput disabled={disabled} />}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            data-slot="input-group-button"
            className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
            disabled={disabled}
          >
            <ComboboxTrigger />
          </InputGroupButton>
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  )
}

function ComboboxChipsField({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  chipsClassName,
  ...props
}: ComboboxPrimitive.Chips.Props & {
  showTrigger?: boolean
  showClear?: boolean
  disabled?: boolean
  chipsClassName?: string
}) {
  return (
    <InputGroup className={cn("w-auto", className)} data-slot="input-group">
      <ComboboxPrimitive.Chips
        data-slot="combobox-chips"
        className={cn(
          "dark:bg-input/30 border-[#d6d6d6] focus-within:border-[#1a1a1a] focus-within:ring-[#1a1a1a]/20 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 has-aria-invalid:border-destructive dark:has-aria-invalid:border-destructive/50 flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border bg-transparent bg-clip-padding px-2.5 py-1.5 text-sm shadow-xs transition-[color,box-shadow] focus-within:ring-[3px] has-aria-invalid:ring-[3px] has-data-[slot=combobox-chip]:px-1.5",
          disabled && "opacity-60 pointer-events-none",
          chipsClassName
        )}
        {...props}
      >
        {children}
      </ComboboxPrimitive.Chips>

      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            data-slot="input-group-button"
            className="data-pressed:bg-transparent"
            disabled={disabled}
          >
            <ComboboxTrigger />
          </InputGroupButton>
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
    </InputGroup>
  )
}

/**
 * ✅ NEW: ComboboxContent now supports:
 * - showSearch (magnifying glass + placeholder)
 * - no background
 * - no outline
 */
function ComboboxContent({
  className,
  children,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor,

  // ✅ Search bar support
  showSearch = false,
  searchPlaceholder = "Search...",
  searchInputProps,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    "side" | "align" | "sideOffset" | "alignOffset" | "anchor"
  > & {
    showSearch?: boolean
    searchPlaceholder?: string
    searchInputProps?: Omit<
      React.ComponentProps<typeof ComboboxInput>,
      "children"
    >
  }) {
  const resolvedSearchInputProps = searchInputProps ?? {}
  const { className: searchClassName, ...restSearchInputProps } =
    resolvedSearchInputProps

  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-chips={!!anchor}
          className={cn(
            "w-(--anchor-width) max-w-(--available-width)",
            "bg-[var(--Light-Background-Primary,#FFF)] text-popover-foreground flex flex-col items-start gap-4 px-3 py-4 self-stretch rounded-[0.75rem] " +
              "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 " +
              "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 " +
              "ring-[#d6d6d6] ring-1 duration-100 origin-(--transform-origin) relative max-h-96 " +
              "*:data-[slot=input-group]:border-[#d6d6d6] " +
              "*:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-8 *:data-[slot=input-group]:shadow-none",
            className
          )}
          {...props}
        >
          {showSearch && (
            <div
              className={cn(
                "w-full",
                "flex items-center gap-2",
                "px-3 py-1",
                "rounded-md",
                "border border-[#d6d6d6]",
                "bg-transparent",
                "h-10",
                searchClassName
              )}
            >
              <SearchIcon className="size-4 text-muted-foreground" />
              <input
                {...(restSearchInputProps as any)}
                placeholder={searchPlaceholder}
                className={cn(
                  "w-full bg-transparent",
                  "outline-none ring-0 focus:outline-none focus:ring-0",
                  "text-sm",
                  "placeholder:text-muted-foreground"
                )}
              />
            </div>
          )}

          {children}
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        "w-full self-stretch max-h-[min(calc(--spacing(96)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1 overflow-y-auto p-0 px-2 data-empty:p-0 flex flex-col gap-3" +
          " [&::-webkit-scrollbar]:w-[0.625rem]" +
          " [&::-webkit-scrollbar-track]:bg-[#F9F9F9]" +
          " [&::-webkit-scrollbar-track]:rounded-full" +
          " [&::-webkit-scrollbar-track]:mt-8" +
          " [&::-webkit-scrollbar-track]:mx-2 [&::-webkit-scrollbar-track]:mb-px" +
          " [&::-webkit-scrollbar-thumb]:bg-[#E6E6E6]" +
          " [&::-webkit-scrollbar-thumb]:rounded-full" +
          " [&::-webkit-scrollbar-thumb]:min-h-[2.833rem]" +
          " [scrollbar-width:thin] [scrollbar-color:#E6E6E6_#F9F9F9]",
        className
      )}
      {...props}
    />
  )
}

function ComboboxItem({
  className,
  children,
  showIndicator,
  indicator,

  // ✅ checkbox support for multi-select
  showCheckbox = false,
  checkboxClassName,
  ...props
}: ComboboxPrimitive.Item.Props & {
  showIndicator?: boolean
  indicator?: React.ReactNode
  showCheckbox?: boolean
  checkboxClassName?: string
}) {
  const resolvedShowIndicator = showIndicator ?? !showCheckbox

  if (showCheckbox) {
    return (
      <ComboboxPrimitive.Item
        data-slot="combobox-item"
        className={cn(
          "self-stretch w-full data-[highlighted]:bg-[#EDEDED] data-[highlighted]:text-[#1a1a1a] data-[pressed]:bg-[#DFDFDF] data-[selected]:bg-[#DFDFDF] data-[selected]:text-[#1a1a1a] relative flex cursor-pointer items-center gap-2 rounded-lg h-8 py-2 pl-2 pr-0 text-sm leading-4 outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          className
        )}
        render={(itemProps, state) => {
          const {
            children: itemChildren,
            className: itemClassName,
            ...restItemProps
          } = itemProps as React.HTMLAttributes<HTMLDivElement> & {
            children?: React.ReactNode
          }

          return (
            <div
              {...restItemProps}
              data-slot="combobox-item"
              className={itemClassName}
            >
              <Checkbox
                checked={!!state.selected}
                disabled={!!state.disabled}
                aria-hidden="true"
                tabIndex={-1}
                className={cn("pointer-events-none", checkboxClassName)}
              />

              {itemChildren}

              {resolvedShowIndicator ? (
                <ComboboxPrimitive.ItemIndicator
                  data-slot="combobox-item-indicator"
                  render={
                    <span className="pointer-events-none ml-auto flex size-4 items-center justify-center" />
                  }
                >
                  {indicator ?? (
                    <CheckIcon className="pointer-events-none size-4 pointer-coarse:size-5" />
                  )}
                </ComboboxPrimitive.ItemIndicator>
              ) : null}
            </div>
          )
        }}
        {...props}
      >
        {children}
      </ComboboxPrimitive.Item>
    )
  }

  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "self-stretch w-full data-[highlighted]:bg-[#EDEDED] data-[highlighted]:text-[#1a1a1a] data-[pressed]:bg-[#DFDFDF] data-[selected]:bg-[#DFDFDF] data-[selected]:text-[#1a1a1a] relative flex cursor-pointer items-center gap-2 rounded-lg h-8 py-2 pl-2 pr-0 text-sm leading-4 outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}

      {resolvedShowIndicator ? (
        <ComboboxPrimitive.ItemIndicator
          data-slot="combobox-item-indicator"
          render={
            <span className="pointer-events-none ml-auto flex size-4 items-center justify-center" />
          }
        >
          {indicator ?? (
            <CheckIcon className="pointer-events-none size-4 pointer-coarse:size-5" />
          )}
        </ComboboxPrimitive.ItemIndicator>
      ) : null}
    </ComboboxPrimitive.Item>
  )
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      className={cn(className)}
      {...props}
    />
  )
}

function ComboboxLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn(
        "text-muted-foreground px-2 py-1.5 text-xs pointer-coarse:px-3 pointer-coarse:py-2 pointer-coarse:text-sm",
        className
      )}
      {...props}
    />
  )
}

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
  return (
    <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
  )
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        "text-muted-foreground hidden w-full justify-center py-2 text-center text-sm group-data-empty/combobox-content:flex",
        className
      )}
      {...props}
    />
  )
}

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function ComboboxChips({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips> &
  ComboboxPrimitive.Chips.Props) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        "dark:bg-input/30 border-[#d6d6d6] focus-within:border-[#1a1a1a] focus-within:ring-[#1a1a1a]/20 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 has-aria-invalid:border-destructive dark:has-aria-invalid:border-destructive/50 flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border bg-transparent bg-clip-padding px-2.5 py-1.5 text-sm shadow-xs transition-[color,box-shadow] focus-within:ring-[3px] has-aria-invalid:ring-[3px] has-data-[slot=combobox-chip]:px-1.5",
        className
      )}
      {...props}
    />
  )
}

function ComboboxChip({
  className,
  children,
  showRemove = true,
  ...props
}: ComboboxPrimitive.Chip.Props & {
  showRemove?: boolean
}) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        "bg-muted text-foreground flex h-[calc(--spacing(5.5))] w-fit items-center justify-center gap-1 rounded-sm px-1.5 text-xs font-medium whitespace-nowrap has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-[slot=combobox-chip-remove]:pr-0",
        className
      )}
      {...props}
    >
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove
          render={<Button variant="ghost" size="icon-xs" />}
          className="-ml-1 opacity-50 hover:opacity-100"
          data-slot="combobox-chip-remove"
        >
          <XIcon className="pointer-events-none" />
        </ComboboxPrimitive.ChipRemove>
      )}
    </ComboboxPrimitive.Chip>
  )
}

function ComboboxChipsInput({
  className,
  children,
  ...props
}: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      className={cn("min-w-16 flex-1 outline-none", className)}
      {...props}
    />
  )
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null)
}

export {
  Combobox,
  ComboboxInput,
  ComboboxChipsField,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
}
