import { useReducer, useCallback } from 'react';

// State interface
interface RegistrationState {
  selectedDates: Date[];
  vegetarianDates: Set<string>;
  isEditing: boolean;
  hasSubmitted: boolean;
  loading: boolean;
}

// Action types
type RegistrationAction =
  | { type: 'SET_DATES'; payload: Date[] }
  | { type: 'SET_VEGETARIAN_DATES'; payload: Set<string> }
  | { type: 'TOGGLE_DATE'; payload: Date }
  | { type: 'TOGGLE_VEGETARIAN'; payload: string }
  | { type: 'START_EDITING' }
  | { type: 'CANCEL_EDITING'; payload: { dates: Date[]; vegetarianDates: Set<string> } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_HAS_SUBMITTED'; payload: boolean }
  | { type: 'SELECT_ALL_DATES'; payload: Date[] }
  | { type: 'DESELECT_FUTURE_DATES'; payload: Date[] }
  | { type: 'ROLLBACK'; payload: { dates: Date[]; vegetarianDates: Set<string> } };

// Initial state
const initialState: RegistrationState = {
  selectedDates: [],
  vegetarianDates: new Set(),
  isEditing: false,
  hasSubmitted: false,
  loading: false,
};

// Reducer
function registrationReducer(
  state: RegistrationState,
  action: RegistrationAction
): RegistrationState {
  switch (action.type) {
    case 'SET_DATES':
      return { ...state, selectedDates: action.payload };

    case 'SET_VEGETARIAN_DATES':
      return { ...state, vegetarianDates: action.payload };

    case 'TOGGLE_DATE': {
      const dateString = action.payload.toDateString();
      const isSelected = state.selectedDates.some(
        (d) => d.toDateString() === dateString
      );

      if (isSelected) {
        // Remove date and its vegetarian status
        const newDates = state.selectedDates.filter(
          (d) => d.toDateString() !== dateString
        );
        const year = action.payload.getFullYear();
        const month = String(action.payload.getMonth() + 1).padStart(2, '0');
        const day = String(action.payload.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;
        
        const newVegDates = new Set(state.vegetarianDates);
        newVegDates.delete(dateKey);
        
        return {
          ...state,
          selectedDates: newDates,
          vegetarianDates: newVegDates,
        };
      } else {
        return {
          ...state,
          selectedDates: [...state.selectedDates, action.payload],
        };
      }
    }

    case 'TOGGLE_VEGETARIAN': {
      const newVegDates = new Set(state.vegetarianDates);
      if (newVegDates.has(action.payload)) {
        newVegDates.delete(action.payload);
      } else {
        newVegDates.add(action.payload);
      }
      return { ...state, vegetarianDates: newVegDates };
    }

    case 'START_EDITING':
      return { ...state, isEditing: true };

    case 'CANCEL_EDITING':
      return {
        ...state,
        isEditing: false,
        selectedDates: action.payload.dates,
        vegetarianDates: action.payload.vegetarianDates,
      };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_HAS_SUBMITTED':
      return { ...state, hasSubmitted: action.payload };

    case 'SELECT_ALL_DATES':
      return {
        ...state,
        selectedDates: [
          ...state.selectedDates.filter(d => {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const dateStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            return dateStart.getTime() <= todayStart.getTime();
          }),
          ...action.payload
        ],
      };

    case 'DESELECT_FUTURE_DATES':
      return {
        ...state,
        selectedDates: action.payload,
        vegetarianDates: new Set(
          Array.from(state.vegetarianDates).filter(dateKey => {
            return action.payload.some(date => {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}` === dateKey;
            });
          })
        ),
      };

    case 'ROLLBACK':
      return {
        ...state,
        selectedDates: action.payload.dates,
        vegetarianDates: action.payload.vegetarianDates,
      };

    default:
      return state;
  }
}

// Custom hook
export function useRegistrationState() {
  const [state, dispatch] = useReducer(registrationReducer, initialState);

  const setDates = useCallback((dates: Date[]) => {
    dispatch({ type: 'SET_DATES', payload: dates });
  }, []);

  const setVegetarianDates = useCallback((dates: Set<string>) => {
    dispatch({ type: 'SET_VEGETARIAN_DATES', payload: dates });
  }, []);

  const toggleDate = useCallback((date: Date) => {
    dispatch({ type: 'TOGGLE_DATE', payload: date });
  }, []);

  const toggleVegetarian = useCallback((dateKey: string) => {
    dispatch({ type: 'TOGGLE_VEGETARIAN', payload: dateKey });
  }, []);

  const startEditing = useCallback(() => {
    dispatch({ type: 'START_EDITING' });
  }, []);

  const cancelEditing = useCallback((dates: Date[], vegetarianDates: Set<string>) => {
    dispatch({ type: 'CANCEL_EDITING', payload: { dates, vegetarianDates } });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setHasSubmitted = useCallback((hasSubmitted: boolean) => {
    dispatch({ type: 'SET_HAS_SUBMITTED', payload: hasSubmitted });
  }, []);

  const selectAllDates = useCallback((dates: Date[]) => {
    dispatch({ type: 'SELECT_ALL_DATES', payload: dates });
  }, []);

  const deselectFutureDates = useCallback((dates: Date[]) => {
    dispatch({ type: 'DESELECT_FUTURE_DATES', payload: dates });
  }, []);

  const rollback = useCallback((dates: Date[], vegetarianDates: Set<string>) => {
    dispatch({ type: 'ROLLBACK', payload: { dates, vegetarianDates } });
  }, []);

  return {
    state,
    actions: {
      setDates,
      setVegetarianDates,
      toggleDate,
      toggleVegetarian,
      startEditing,
      cancelEditing,
      setLoading,
      setHasSubmitted,
      selectAllDates,
      deselectFutureDates,
      rollback,
    },
  };
}
