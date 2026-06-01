import { useMemo } from 'react';
import { useGetTeacherChoicesQuery } from '../store/api/teacherApi';
import type { SelectOption } from '../components/common/CustomSelect';

/**
 * Teacher dropdown values must be Teacher.id from GET /teacher/choices/ only.
 * Do not use worker/user ids — group and exam APIs validate against Teacher table.
 */
export function useTeacherOptions() {
  const { data: choices = [], isFetching } = useGetTeacherChoicesQuery();

  const options = useMemo((): SelectOption[] => {
    return choices
      .filter((t) => t.id && t.fullName.trim())
      .map((t) => ({ value: t.id, label: t.fullName.trim() }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [choices]);

  return {
    options,
    isLoading: isFetching,
    isEmpty: !isFetching && options.length === 0,
  };
}
