import React from "react";

interface BarcodeProps {
  serial?: string;
}

export default function Barcode({ serial = "COPA-2026-B01-449" }: BarcodeProps) {
  // Let's generate pseudo-random barcode lines using an array of classes
  const linePattern = [
    "w-[2px]", "w-[4px]", "w-[1px]", "w-[6px]", "w-[2px]", "w-[1px]", "w-[3px]", "w-[5px]", 
    "w-[1px]", "w-[4px]", "w-[2px]", "w-[2px]", "w-[6px]", "w-[1px]", "w-[4px]", "w-[3px]",
    "w-[1px]", "w-[5px]", "w-[2px]", "w-[6px]", "w-[1px]", "w-[3px]", "w-[4px]", "w-[2px]",
    "w-[2px]", "w-[5px]", "w-[1px]", "w-[4px]", "w-[3px]", "w-[1px]", "w-[6px]", "w-[2px]"
  ];

  return (
    <div className="flex flex-col items-center justify-center py-4 select-none opacity-85">
      <div className="flex items-stretch h-10 bg-black/9 px-4 py-1 gap-[1px]">
        {linePattern.map((widthClass, index) => (
          <div
            key={index}
            className={`${widthClass} bg-neutral-800 h-full`}
            style={{ opacity: index % 5 === 0 ? 0.6 : 1 }}
          />
        ))}
      </div>
      <span className="text-[10px] font-mono tracking-[4px] text-neutral-600 mt-1 uppercase">
        {serial}
      </span>
    </div>
  );
}
