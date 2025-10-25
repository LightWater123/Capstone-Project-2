import { Car } from 'lucide-react';
import { Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TypeSelectorModal({
  isOpen,
  onClose,
  onSelectType,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-30">
      <div className="bg-white/95 p-10 rounded-lg w-full max-w-md shadow-lg border-collapse relative">
        <h2 className="text-xl font-bold text-gray-500 mb-4 text-center pb-3 border-b">
          Select Equipment Type
        </h2>
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-2xl leading-none"
        >
          &times;
        </button>

        <div className="flex gap-7 justify-center">
          <Button
            className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-950"
            onClick={() => {
              onSelectType("PPE");
              onClose();
            }}
          >
          <Car className="h-4 w-4 inline-block mr-2" />
            PPE
          </Button>
          <Button
            className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-950"
            onClick={() => {
              onSelectType("RPCSP");
              onClose();
            }}
          >
            <Keyboard className="h-4 w-4 inline-block mr-2" />
            RPCSP
          </Button>
        </div>
      </div>
    </div>
  );
}
