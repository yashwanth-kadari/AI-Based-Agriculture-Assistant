import React, { createContext, useContext, useState, useMemo } from 'react';

const LocationContext = createContext();

/**
 * LocationProvider
 *
 * Single source of truth for the active farm location shown across the app.
 *
 * Priority order:
 *   1. Manual override stored in state and localStorage per-user
 *   2. Farmer's saved profile (users.state / users.district) from login user object
 *   3. Empty state: { state: null, district: null }
 */

export const LocationProvider = ({ children, user }) => {
    const userKey = user?.id
        ? `location_${user.id}`
        : user?.email
            ? `location_${user.email}`
            : null;

    const [manualOverride, setManualOverride] = useState(() => {
        if (!userKey) return null;
        try {
            const saved = localStorage.getItem(userKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.state && parsed.district) return parsed;
            }
        } catch {
            // ignore corrupt data
        }
        return null;
    });

    const location = useMemo(() => {
        if (manualOverride?.state && manualOverride?.district) {
            return manualOverride;
        }
        if (user?.state && user?.district) {
            return { state: user.state, district: user.district };
        }
        return { state: null, district: null };
    }, [manualOverride, user]);

    const setLocation = (newLoc) => {
        const formatted = {
            state: newLoc.state || null,
            district: newLoc.district || null,
        };
        setManualOverride(formatted);
        if (userKey && formatted.state && formatted.district) {
            try {
                localStorage.setItem(userKey, JSON.stringify(formatted));
            } catch {
                // ignore
            }
        }
    };

    return (
        <LocationContext.Provider value={{ location, setLocation }}>
            {children}
        </LocationContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLocationContext = () => {
    const context = useContext(LocationContext);
    if (!context) {
        return {
            location: { state: null, district: null },
            setLocation: () => { },
        };
    }
    return context;
};

export default LocationContext;
