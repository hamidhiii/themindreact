import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { authApi } from './api/authApi';
import { dashboardApi } from './api/dashboardApi';
import { studentApi } from './api/studentApi';
import { groupApi } from './api/groupApi';
import { teacherApi } from './api/teacherApi';
import { examApi } from './api/examApi';
import { leadApi } from './api/leadApi';
import { salaryApi } from './api/salaryApi';
import { transactionApi } from './api/transactionApi';
import { workerApi } from './api/workerApi';

import { taskApi } from './api/taskApi';
import { mainTheMindApi } from './api/mainTheMindApi';
import { settingsApi } from './api/settingsApi';
import { penaltyApi } from './api/penaltyApi';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        [authApi.reducerPath]: authApi.reducer,
        [dashboardApi.reducerPath]: dashboardApi.reducer,
        [studentApi.reducerPath]: studentApi.reducer,
        [groupApi.reducerPath]: groupApi.reducer,
        [teacherApi.reducerPath]: teacherApi.reducer,
        [examApi.reducerPath]: examApi.reducer,
        [leadApi.reducerPath]: leadApi.reducer,
        [salaryApi.reducerPath]: salaryApi.reducer,
        [transactionApi.reducerPath]: transactionApi.reducer,
        [workerApi.reducerPath]: workerApi.reducer,
        [taskApi.reducerPath]: taskApi.reducer,
        [mainTheMindApi.reducerPath]: mainTheMindApi.reducer,
        [settingsApi.reducerPath]: settingsApi.reducer,
        [penaltyApi.reducerPath]: penaltyApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            authApi.middleware,
            dashboardApi.middleware,
            studentApi.middleware,
            groupApi.middleware,
            teacherApi.middleware,
            examApi.middleware,
            leadApi.middleware,
            salaryApi.middleware,
            transactionApi.middleware,
            workerApi.middleware,
            taskApi.middleware,
            mainTheMindApi.middleware,
            settingsApi.middleware,
            penaltyApi.middleware,
        ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
