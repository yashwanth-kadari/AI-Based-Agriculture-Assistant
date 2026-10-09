import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

/**
 * LocationProvider
 *
 * Single source of truth for the active farm location shown across the app.
 *
 * Priority order (highest wins):
 *   1. Farmer's saved profile (users.state / users.district) from the login response
 *      — always applied fresh on login, clears any stale localStorage from a
 *        prior session or a different account.
 *   2. A manual override stored in localStorage under a PER-USER key so two
 *      different accounts can each have their own saved override without
 *      bleeding into each other.
 *   3. A genuine empty/no-data state shown as null so the UI can display
 *      "Location not set — update your profile" rather than fake default data.
 *
 * NOTE: navigator.geolocation is NOT used here. The "Detect via GPS" button
 * in the Navbar location modal is a convenience that lets the farmer pick a
 * real Indian state/district manually — it no longer calls the browser GPS API
 * because the real GPS coordinates cannot be reverse-geocoded to Indian
 * state/district names without an external paid API.
 */

export const LocationProvider = ({ children, user }) => {
    const userKey = user?.id
        ? `location_${user.id}`
        : user?.email
            ? `location_${user.email}`
            : null;

    const [location, setLocationState] = useState(() => {
        // 1. Always trust the login-provided profile first if available
        if (user?.state && user?.district) {
            return { state: user.state, district: user.district };
        }

        // 2. Try per-user localStorage override (e.g. user manually changed location)
        if (userKey) {
            try {
                const saved = localStorage.getItem(userKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.state && parsed.district) return parsed;
                }
            } catch {
                // ignore corrupt data
            }
        }

        // 3. No data: return null fields so UI can show honest empty state
        return { state: null, district: null };
    });

    // When user logs in or profile changes, always re-sync from profile
    useEffect(() => {
        if (user?.state && user?.district) {
            const profileLoc = { state: user.state, district: user.district };
            setLocationState(profileLoc);
            // Write to per-user key (not a global 'selectedLocation') only if
            // user hasn't manually overridden yet for this session
            if (userKey) {
                try {
                    const existing = localStorage.getItem(userKey);
                    if (!existing) {
                        localStorage.setItem(userKey, JSON.stringify(profileLoc));
                    }
                } catch {
                    // ignore
                }
            }
        }
    }, [user?.id, user?.state, user?.district, userKey]);

    // When user logs out (user becomes null), clear location to null
    useEffect(() => {
        if (!user) {
            setLocationState({ state: null, district: null });
        }
    }, [user]);

    const setLocation = (newLoc) => {
        const formatted = {
            state: newLoc.state || null,
            district: newLoc.district || null,
        };
        setLocationState(formatted);
        // Persist per-user so other accounts aren't affected
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
