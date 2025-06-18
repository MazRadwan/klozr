"use client";

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DropResult } from '@hello-pangea/dnd';
import { updateDealStage, DealStage } from '@/lib/dealUtils';

export function useKanbanDragDrop() {
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    
    // No destination means the item was dropped outside a droppable area
    if (!result.destination) {
      console.log('Drag cancelled - no destination');
      return;
    }
    
    const dealId = parseInt(result.draggableId);
    const newStage = result.destination.droppableId as DealStage;
    const sourceStage = result.source.droppableId as DealStage;
    
    // Skip if dropped in the same column
    if (sourceStage === newStage) {
      console.log('Drag cancelled - same column');
      return;
    }

    console.log(`Moving deal ${dealId} from ${sourceStage} to ${newStage}`);
    
    setIsUpdating(true);
    
    try {
      // Use existing, tested stage update logic from dealUtils
      const updateResult = await updateDealStage(dealId, newStage);
      
      if (updateResult.success) {
        console.log('Deal stage updated successfully');
        
        // Invalidate kanban query to refresh data
        queryClient.invalidateQueries({ 
          queryKey: ['deals', 'kanban'] 
        });
        
        // Also invalidate regular deals query to keep table view in sync
        queryClient.invalidateQueries({ 
          queryKey: ['deals'] 
        });
      } else {
        console.error('Failed to update deal stage:', updateResult.error);
        // TODO: In Phase 2, we'll add toast notifications here
      }
    } catch (error) {
      console.error('Error during deal stage update:', error);
      // TODO: In Phase 2, we'll add error recovery here
    } finally {
      setIsUpdating(false);
    }
  };

  return { 
    handleDragStart, 
    handleDragEnd, 
    isDragging,
    isUpdating
  };
}