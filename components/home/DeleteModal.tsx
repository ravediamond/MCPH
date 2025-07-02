import React from "react";
import { FaExclamationCircle } from "react-icons/fa";
import Card from "../ui/Card";

interface DeleteModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  isVisible,
  onCancel,
  onConfirm,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50 p-4">
      <Card className="max-w-sm w-full p-6">
        <div className="text-center mb-4">
          <FaExclamationCircle className="text-red-500 text-3xl mx-auto mb-2" />
          <h3 className="font-medium text-lg">Delete File?</h3>
          <p className="text-gray-500 mt-2">This action cannot be undone.</p>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </Card>
    </div>
  );
};

export default DeleteModal;
