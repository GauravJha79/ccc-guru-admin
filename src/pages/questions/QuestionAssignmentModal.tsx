import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { questionService } from '../../services/questionService';
import { TestSeriesItem } from '../../types/database';
import { Modal } from '../../components/common/Modal';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';

export interface QuestionAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedQuestionIds: string[];
  testSeriesItems?: TestSeriesItem[];
  onComplete: () => void;
}

export const QuestionAssignmentModal: React.FC<QuestionAssignmentModalProps> = ({
  isOpen,
  onClose,
  selectedQuestionIds,
  testSeriesItems = [],
  onComplete,
}) => {
  const { success, error: toastError } = useToast();

  const [targetItemId, setTargetItemId] = useState(testSeriesItems[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedItem = testSeriesItems.find((i) => i.id === targetItemId);

  const handleAssign = async () => {
    if (!targetItemId) return;
    setIsSubmitting(true);
    try {
      await questionService.assignQuestionsToTest(
        targetItemId,
        selectedQuestionIds
      );

      success(
        'Questions Assigned',
        `Successfully linked ${selectedQuestionIds.length} question(s) to "${selectedItem?.title}" in Supabase.`
      );
      onComplete();
      onClose();
    } catch (err: any) {
      toastError('Assignment Failed', err.message || 'Could not assign questions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Questions to Test Set"
      subtitle={`Selected: ${selectedQuestionIds.length} question(s)`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} isLoading={isSubmitting} leftIcon={<Check className="w-4 h-4" />}>
            Confirm Assignment
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Select
          label="Choose Target Test Set"
          value={targetItemId}
          onChange={(e) => setTargetItemId(e.target.value)}
          options={testSeriesItems.map((item) => ({
            value: item.id,
            label: `${item.title} (${item.test_type} • ${item.question_count} Qs target)`,
          }))}
          required
        />

        {selectedItem && (
          <div className="p-4 rounded-2xl bg-background-elevated/60 border border-dark-border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-dark-muted">Target Question Count:</span>
              <span className="font-bold text-white">{selectedItem.question_count} Questions</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-muted">Questions Being Added:</span>
              <span className="font-bold text-lavender-300">{selectedQuestionIds.length} Questions</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
