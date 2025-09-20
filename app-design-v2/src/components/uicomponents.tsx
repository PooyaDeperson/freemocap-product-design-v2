import React, { useState, useEffect, useRef } from "react";
import clsx from "clsx";

// /**
//  * ToggleComponent
//  * --------------------
//  * A reusable toggle UI component with customizable text, icons, and styles.
//  * Clicking anywhere on the parent div toggles the state.
//  *
//  * Props:
//  * ------
//  * @param {string} text - The label displayed next to the toggle.
//  * @param {React.ReactNode} [iconOn] - Icon or element for the "on" state. Default: "✔️".
//  * @param {React.ReactNode} [iconOff] - Icon or element for the "off" state. Default: "❌".
//  * @param {string} [className] - Optional class for the parent wrapper to extend/override default styles.
//  * @param {string} [iconClass] - Optional class for the dropdown icon to style it independently.
//  *
//  * Usage Example:
//  * --------------
//  * import ToggleComponent from "./components/uicomponents/ToggleComponent";
//  *
//  * function App() {
//  *   return (
//  *     <div className="flex flex-col gap-4">
//  *
//  *       {/* Default toggle */}
//  *       <ToggleComponent text="Default Toggle" />
//  *
//  *       {/* Custom icons with additional parent class */}
//  *       <ToggleComponent
//  *         text="Green Toggle"
//  *         iconOn="🟢"
//  *         iconOff="⚪"
//  *         className="green-toggle"
//  *         iconClass="custom-dropdown-icon"
//  *       />
//  *
//  *       {/* Star icons with unique styling */}
//  *       <ToggleComponent
//  *         text="Stars Toggle"
//  *         iconOn="⭐"
//  *         iconOff="☆"
//  *         className="star-toggle"
//  *         iconClass="star-dropdown-icon"
//  *       />
//  *
//  *     </div>
//  *   );
//  * }
//  *
//  * Notes for Developers:
//  * ---------------------
//  * - The `className` prop lets you customize the parent container style.
//  * - `iconClass` lets you style the dropdown icon independently.
//  * - You can pass any ReactNode to `iconOn` and `iconOff` (emoji, SVG, or JSX elements).
//  * - Clicking anywhere on the parent div toggles the state by default.
//  * - Each toggle manages its own internal state; to control externally, you could refactor to accept `isToggled` and `onToggle` props.
//  */

interface ToggleProps {
  text: string;
  className?: string;
  iconClass?: string;
  defaultToggelState?: boolean;
  isToggled?: boolean;
  onToggle?: (state: boolean) => void;
  disabled?: boolean; // new prop
}

const ToggleComponent: React.FC<ToggleProps> = ({
  text,
  className = "",
  iconClass,
  defaultToggelState = false,
  isToggled,
  onToggle,
  disabled = false,
}) => {
  const [internalToggle, setInternalToggle] = useState(defaultToggelState);

  const toggled = isToggled !== undefined ? isToggled : internalToggle;

const handleToggle = () => {
  if (disabled) return; // ignore clicks if disabled
  const newState = !toggled;
  if (isToggled === undefined) setInternalToggle(newState);
  onToggle?.(newState);
};

  return (
    <div
      className={`button toggle-button gap-1 p-1 br-1 flex justify-content-space-between items-center h-25 ${className} ${disabled ? "disabled" : ""}`}
      onClick={handleToggle}
    >
      <div className="text-container overflow-hidden flex items-center gap-1">
        {iconClass && <span className={`icon icon-size-16 ${iconClass}`}></span>}
        <p className="text text-nowrap text-left md">{text}</p>
      </div>
      <div className={`icon toggle-container ${toggled ? "on" : "off"}`}>
        <div className="icon toggle-circle"></div>
      </div>
    </div>
  );
};


interface SegmentedControlProps {
  /**
   * Array of options to display.
   */
  options: SegmentedControlOption[];
  /**
   * Default selected value (uncontrolled mode).
   */
  defaultValue?: string;
  /**
   * Callback when selection changes.
   */
  onChange?: (value: string) => void;
  /**
   * Additional class for the container.
   */
  className?: string;
  /**
   * Size of the text: "sm" for small, "md" for medium (default).
   */
  size?: "sm" | "md";
  /**
   * Optional value for controlled mode.
   */
  value?: string;
}

/**
 * SegmentedControl Component
 * --------------------------
 * A reusable segmented control (toggle button group) component.
 * Features:
 * - Toggle between options with active/idle states.
 * - Customizable labels, values, and icons.
 * - Callback for selection changes.
 * - Supports controlled and uncontrolled usage.
 * - Supports small and medium text sizes.
 *
 * Props:
 * ------
 * @param {SegmentedControlOption[]} options - Array of options to display.
 * @param {string} [defaultValue] - Default selected value (uncontrolled mode).
 * @param {(value: string) => void} [onChange] - Callback when selection changes.
 * @param {string} [className] - Additional class for the container.
 * @param {"sm" | "md"} [size] - Size of the text.
 * @param {string} [value] - Value for controlled mode.
 *
 * Usage Example:
 * --------------
 * import { SegmentedControl } from "./YourComponentFile";
 *
 * function App() {
 *   const [mode, setMode] = useState("live");
 *   return (
 *     <SegmentedControl
 *       options={[
 *         { label: "Live", value: "live" },
 *         { label: "Post", value: "post" },
 *       ]}
 *       size="sm"
 *       value={mode}
 *       onChange={setMode}
 *     />
 *   );
 * }
 *
 * Notes for Developers:
 * ---------------------
 * - For controlled usage, use `value` and `onChange`.
 * - For uncontrolled usage, use `defaultValue`.
 * - Customize the active/idle styling via CSS classes.
 */
const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  defaultValue,
  onChange,
  className = "",
  size = "md",
  value: controlledValue,
}) => {
  const isControlled = controlledValue !== undefined;
  const [activeValue, setActiveValue] = useState(
    isControlled ? controlledValue : defaultValue || options[0]?.value
  );

  useEffect(() => {
    if (isControlled && controlledValue !== activeValue) {
      setActiveValue(controlledValue);
    }
  }, [controlledValue, isControlled, activeValue]);

  const handleClick = (value: string) => {
    if (!isControlled) {
      setActiveValue(value);
    }
    if (onChange) onChange(value);
  };

  const textSizeClass = size === "sm" ? "sm" : "md";

  return (
    <div
      className={`segmented-control-container br-1-1 gap-1 p-1 bg-middark flex ${className}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          className={`segmented-control-button justify-center button gap-1 br-1 flex-inline items-center ${
            activeValue === option.value
              ? "active text-white bg-dark"
              : "idle text-gray"
          }`}
          onClick={() => handleClick(option.value)}
        >
          {option.iconClass && <i className={option.iconClass} />}
          <p className={`${textSizeClass} text text-center p-1`}>
            {option.label}
          </p>
        </button>
      ))}
    </div>
  );
};

// Example usage:
// --------------
// const [mode, setMode] = useState("live");
// <SegmentedControl
//   options={[
//     { label: "Live Capture", value: "live", iconClass: "live-icon" },
//     { label: "Post-process", value: "post", iconClass: "post-icon" },
//   ]}
//   defaultValue="live"
//   onChange={setMode}
// />

// PROPS for ButtonSm:
// - iconClass (string): class name for the icon (e.g., "live-icon").
// - text (string): the button label text.
// - onClick (function): the action to run when button is clicked.
//   If none is provided, it defaults to a no-op function.

const ButtonSm = ({
  iconClass = "", // left-side icon
  buttonType = "", // valid types are : use classes like this  // for primaruy use: primary full-width justify-center // for secondary use " secondary full-width justify-center ""
  text,
  onClick = () => {},
  rightSideIcon = "", // "externallink" | "dropdown" | ""
  textColor = "text-gray", // "text-gray" | "text-white"
}) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "gap-1 br-1 button sm flex-inline text-left items-center", // base styles
        buttonType, // multiple classes supported here
        rightSideIcon // this is being treated as classes, same as before
      )}
    >
      {/* LEFT ICON */}
      {iconClass && <span className={clsx("icon icon-size-16", iconClass)} />}

      {/* TEXT */}
      <p className={clsx(textColor, "text md text-align-left")}>{text}</p>
    </button>
  );
};

/**
 * Reusable Checkbox Component
 * ----------------------------
 * - Combines a native <input type="checkbox"> with a text label (<p> tag).
 * - Use the `label` prop to change the string next to the checkbox.
 * - `checked` + `onChange` make this component controllable from parent state.
 * - The entire container is clickable to toggle the checkbox.
 */

interface CheckboxProps {
  label: string; // text shown next to the checkbox (developers can change this freely)
  checked?: boolean; // optional controlled state
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void; // handler for state changes
}

const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange }) => {
  return (
    <div
      className="button checkbox gap-1 flex flex-row items-center"
      onClick={(e) => {
        // Allow clicking anywhere on the container to toggle checkbox
        if (onChange) {
          onChange({
            ...e,
            target: { ...(e.target as HTMLInputElement), checked: !checked },
          } as React.ChangeEvent<HTMLInputElement>);
        }
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="button"
      />
      <p className="text-gray text sm text-align-left">{label}</p>
    </div>
  );
};

/**
 * ButtonCard Component
 * --------------------
 * A reusable UI component that displays a card-like button with:
 * - An icon (customizable via CSS class)
 * - A text label (string passed as a prop)
 * - A click handler (function passed as a prop)
 *
 * Props:
 * ------
 * @param {string} text - The text displayed under the icon.
 * @param {string} iconClass - The class(es) applied to the <span> element for styling the icon.
 * Example: "live-icon icon-size-42".
 * @param {function} onClick - The function triggered when the button is clicked.
 * @param {string} [className] - (Optional) Additional classes to extend/override the default wrapper styles.
 *
 * Usage Example:
 * --------------
 * import ButtonCard from "./ButtonCard";
 *
 * function App() {
 * const handleLiveClick = () => {
 * console.log("Capture Live button clicked!");
 * };
 *
 * return (
 * <div className="flex gap-4">
 * <ButtonCard
 * text="Capture Live"
 * iconClass="live-icon icon-size-42"
 * onClick={handleLiveClick}
 * />
 *
 * <ButtonCard
 * text="Upload File"
 * iconClass="upload-icon icon-size-42"
 * onClick={() => alert("Upload File clicked")}
 * className="bg-blue-600"
 * />
 * </div>
 * );
 * }
 *
 * Notes for Developers:
 * ---------------------
 * - The `iconClass` lets you swap out icons dynamically by just changing the class string.
 * - If you need SVG or inline icons, you can refactor to accept an `icon` ReactNode prop instead.
 * - The default styling is based on the original HTML snippet (dark background, flex, centered).
 * Override or extend using the optional `className` prop.
 */

const ButtonCard = ({ text, iconClass, onClick, className = "" }) => {
  return (
    <div
      className={`button items-center flex-col justify-content-space-between p-3 text-aligh-center button card bg-dark flex-1 br-2 flex items-center justify-center text-white text-xs ${className}`}
      onClick={onClick}
    >
      {/* Icon section - styled via passed classes */}
      <span className={`icon m-3 ${iconClass}`}></span>

      {/* Text section */}
      <p className="text-center text bg">{text}</p>
    </div>
  );
};

/* Dropdown button */



interface DropdownButtonProps {
  buttonProps: {
    text: string;
    iconClass?: string;
    rightSideIcon?: string;
    textColor?: string;
    buttonType?: string;
    onClick?: () => void; // optional, in addition to dropdown toggle
  };
  dropdownItems?: ReactNode; // any JSX to render inside dropdown
  containerClassName?: string; // NEW: optional classes for the container div
}

export default function DropdownButton({
  buttonProps,
  dropdownItems,
  containerClassName, // NEW: allow external classes
}: DropdownButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleButtonClick = () => {
    // Toggle dropdown
    setOpen((prev) => !prev);
    // Run any additional onClick passed to the main button
    buttonProps.onClick?.();
  };

  return (
    <div
      ref={containerRef}
      // Default classes + any custom ones provided
      className={clsx("flex flex-col z-2", containerClassName)}
    >
      <ButtonSm
        {...buttonProps}
        onClick={handleButtonClick} // wraps dropdown toggle + optional extra onClick
      />

      {open && (
        <div
          className="reveal slide-down dropdown-container border-1 border-black bg-middark br-2 pos-abs flex flex-col gap-1 p-1"
          style={{ top: "33px" }}
        >
          {dropdownItems}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
USAGE EXAMPLES

1. Basic usage (same as before, default container styling):

<DropdownButton
  buttonProps={{ text: "Menu" }}
  dropdownItems={<div>Item 1</div>}
/>

2. Add custom styles to the container:

<DropdownButton
  buttonProps={{ text: "Menu" }}
  dropdownItems={<div>Item 1</div>}
  containerClassName="items-end bg-gray-800"
/>

➡ This will merge the default classes (flex flex-col z-2 align-end) with your
   provided classes (items-end bg-gray-800).

3. Advanced example with extra button props:

<DropdownButton
  buttonProps={{
    text: "Settings",
    iconClass: "icon-gear",
    textColor: "text-white",
    buttonType: "primary",
    onClick: () => console.log("Main button clicked"),
  }}
  dropdownItems={
    <>
      <div>Profile</div>
      <div>Logout</div>
    </>
  }
  containerClassName="w-48 border rounded shadow-lg"
/>

-------------------------------------------------------------------------- */


/* Toggle button states */
const STATES = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
};

/* Controlled ToggleButtonComponent */
const ToggleButtonComponent = ({
  state,
  connectConfig,
  connectingConfig,
  connectedConfig,
  textColor = "text-gray",
  onConnect = () => {},
  onDisconnect = () => {},
}) => {
  const handleClick = () => {
    if (state === STATES.DISCONNECTED) {
      onConnect();
    } else if (state === STATES.CONNECTED) {
      onDisconnect();
    }
  };

  const getButtonConfig = () => {
    switch (state) {
      case STATES.CONNECTING:
        return connectingConfig;
      case STATES.CONNECTED:
        return connectedConfig;
      default:
        return connectConfig;
    }
  };

  const { text, iconClass, rightSideIcon, extraClasses } = getButtonConfig();

  return (
    <button
      onClick={handleClick}
      disabled={state === STATES.CONNECTING}
      className={clsx(
        "gap-1 br-1 button sm flex-inline text-left items-center",
        extraClasses,
        rightSideIcon
      )}
    >
      {iconClass && <span className={`icon icon-size-16 ${iconClass}`} />}
      <p className={`${textColor} text md text-align-left`}>{text}</p>
    </button>
  );
};

/* ConnectionDropdown: parent component */
const ConnectionDropdown = () => {
  const [connections, setConnections] = useState({
    python: STATES.DISCONNECTED,
    websocket: STATES.DISCONNECTED,
  });

  const handleConnect = (type) => {
    setConnections((prev) => ({ ...prev, [type]: STATES.CONNECTING }));

    // Simulate async connection
    setTimeout(() => {
      setConnections((prev) => ({ ...prev, [type]: STATES.CONNECTED }));
    }, 2000);
  };

  const handleDisconnect = (type) => {
    setConnections((prev) => ({ ...prev, [type]: STATES.DISCONNECTED }));
  };

  const getToggleConfig = (state) => {
    switch (state) {
      case STATES.CONNECTING:
        return {
          text: "Connecting...",
          iconClass: "loader-icon",
          extraClasses: "loading disabled",
        };
      case STATES.CONNECTED:
        return {
          text: "Connected",
          iconClass: "connected-icon",
          extraClasses: "activated",
        };
      default:
        return {
          text: "Connect",
          iconClass: "warning-icon",
          extraClasses: "",
        };
    }
  };

  const connectionTypes = [
    { key: "python", label: "Python server" },
    { key: "websocket", label: "Websocket" },
  ];

  // --- Derive dropdown button state ---
  const getDropdownButtonState = () => {
    if (Object.values(connections).every((s) => s === STATES.CONNECTED)) {
      return { text: "All Connected", iconClass: "connected-icon" };
    } else if (Object.values(connections).some((s) => s === STATES.CONNECTING)) {
      return { text: "Connecting...", iconClass: "loader-icon" };
    } else if (Object.values(connections).some((s) => s === STATES.CONNECTED)) {
      return { text: "Partially Connected", iconClass: "connected-icon" };
    } else {
      return { text: "Not Connected", iconClass: "warning-icon" };
    }
  };

  const dropdownButtonState = getDropdownButtonState();

  return (
    <DropdownButton
      buttonProps={{
        text: dropdownButtonState.text,
        iconClass: dropdownButtonState.iconClass,
        rightSideIcon: "dropdown",
        textColor: "text-gray",
      }}
      dropdownItems={
        <div className="connection-container flex flex-col p-1 gap-1 br-2 bg-darkgray border-1 border-mid-black">
          {connectionTypes.map(({ key, label }) => (
            <div
              key={key}
              className="gap-1 p-1 br-1 flex justify-content-space-between items-center h-25"
            >
              <div className="text-container overflow-hidden flex items-center gap-1">
                <span
                  className={`icon icon-size-16 ${getToggleConfig(
                    connections[key]
                  ).iconClass}`}
                ></span>
                <p className="text text-nowrap text-left bg">{label}</p>
              </div>

              <ToggleButtonComponent
                state={connections[key]}
                connectConfig={getToggleConfig(STATES.DISCONNECTED)}
                connectingConfig={getToggleConfig(STATES.CONNECTING)}
                connectedConfig={getToggleConfig(STATES.CONNECTED)}
                textColor="text-white"
                onConnect={() => handleConnect(key)}
                onDisconnect={() => handleDisconnect(key)}
              />
            </div>
          ))}

          <div className="flex flex-row p-1 gap-1">
            <p className="text-left text">
              Having trouble connecting? Learn how to connect...
            </p>
          </div>
        </div>
      }
    />
  );
};


export {
  ButtonSm,
  Checkbox,
  ButtonCard,
  SegmentedControl,
  ToggleComponent,
  DropdownButton,
  ToggleButtonComponent,
  ConnectionDropdown,
};
