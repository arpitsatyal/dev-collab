import dayjs from 'dayjs';

export function extractTime(date: string | Date): string {
  return dayjs(date).format('hh:mm A');
}

export function extractDate(date: string | Date): string {
  return dayjs(date).format('MM/DD/YYYY');
}
