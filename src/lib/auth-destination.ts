export const birthdayPath = '/miniproject/birthday-3d';
export const dashboardPath = '/dashboard';

export function loginDestination(next: unknown) {
    return next === birthdayPath ? birthdayPath : dashboardPath;
}
