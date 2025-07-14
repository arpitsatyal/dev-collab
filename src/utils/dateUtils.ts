import dayjs from 'dayjs';

export function extractTime(isoString: string): string {
  return dayjs(isoString).format('hh:mm A');
}

export function extractDate(isoString: string): string {
  return dayjs(isoString).format('MM/DD/YYYY');
}
