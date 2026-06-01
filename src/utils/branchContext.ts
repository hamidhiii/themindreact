const BRANCH_ID_KEY = 'selectedBranchId';
const BRANCH_NAME_KEY = 'selectedBranchName';

type Listener = () => void;
const listeners = new Set<Listener>();

export function getSelectedBranchId(): string | null {
    const v = localStorage.getItem(BRANCH_ID_KEY)?.trim();
    return v ? v : null;
}

export function getSelectedBranchName(): string | null {
    const v = localStorage.getItem(BRANCH_NAME_KEY)?.trim();
    return v ? v : null;
}

export function selectBranch(branchId: string | number, branchName: string) {
    localStorage.setItem(BRANCH_ID_KEY, String(branchId));
    localStorage.setItem(BRANCH_NAME_KEY, branchName);
    listeners.forEach((l) => l());
}

export function clearBranch() {
    localStorage.removeItem(BRANCH_ID_KEY);
    localStorage.removeItem(BRANCH_NAME_KEY);
    listeners.forEach((l) => l());
}

export function subscribeBranch(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function ensureDefaultBranch(defaultId = '1', defaultName = 'Main') {
    if (!getSelectedBranchId()) selectBranch(defaultId, defaultName);
}
