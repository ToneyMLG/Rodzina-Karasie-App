import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Navigation
    familyTree: "Family Tree",
    gallery: "Gallery",
    addMember: "Add Member",
    exportPDF: "Export PDF",
    share: "Share",
    search: "Search members...",

    // Member Profile
    firstName: "First Name",
    surname: "Surname",
    dateOfBirth: "Date of Birth",
    dateOfDeath: "Date of Death",
    stillAlive: "Still Alive",
    birthPlace: "Birth Place",
    tombstoneLocation: "Tombstone Location",
    tombstonePhoto: "Tombstone Photo",
    profilePicture: "Profile Picture",
    photos: "Photos",
    saveChanges: "Save Changes",
    removeFromTree: "Remove from Tree",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",

    // Generations
    greatGrandparents: "Great Grandparents",
    grandparents: "Grandparents",
    parents: "Parents",
    yourGeneration: "Your Generation",
    children: "Children",
    grandchildren: "Grandchildren",

    // Gallery
    uploadPhotos: "Upload Photos",
    dragDrop: "Drag & drop photos here or click to browse",
    tagMembers: "Tag Members",
    customTags: "Custom Tags",
    noPhotos: "No photos yet",
    filterByTag: "Filter by tag...",

    // Share
    shareTree: "Share Your Family Tree",
    viewer: "Viewer",
    editor: "Editor",
    viewerDesc: "Can view tree and profiles",
    editorDesc: "Can edit members and upload photos",
    copyLink: "Copy Link",
    linkCopied: "Link copied!",

    // AI Chat
    askAboutFamily: "Ask about your family...",
    aiAssistant: "Family Assistant",
    aiGreeting: "Hello! I can help you find information about your family. Try asking 'When was John born?' or 'Show me photos of Mary'",

    // Misc
    age: "Age",
    years: "years",
    born: "Born",
    died: "Died",
    alive: "Alive",
    deceased: "Deceased",
    noMembers: "No family members yet. Add your first member to start building your tree.",
    confirmDelete: "Are you sure you want to remove this member from the tree?",
    required: "Required",
    optional: "Optional",
    notes: "Notes",
    spouse: "Spouse",
    parents: "Parents",
    selectParents: "Select Parents",
    selectSpouse: "Select Spouse",
    none: "None"
  },
  pl: {
    // Navigation
    familyTree: "Drzewo Genealogiczne",
    gallery: "Galeria",
    addMember: "Dodaj Członka",
    exportPDF: "Eksportuj PDF",
    share: "Udostępnij",
    search: "Szukaj członków...",

    // Member Profile
    firstName: "Imię",
    surname: "Nazwisko",
    dateOfBirth: "Data Urodzenia",
    dateOfDeath: "Data Śmierci",
    stillAlive: "Żyje",
    birthPlace: "Miejsce Urodzenia",
    tombstoneLocation: "Lokalizacja Nagrobka",
    tombstonePhoto: "Zdjęcie Nagrobka",
    profilePicture: "Zdjęcie Profilowe",
    photos: "Zdjęcia",
    saveChanges: "Zapisz Zmiany",
    removeFromTree: "Usuń z Drzewa",
    cancel: "Anuluj",
    edit: "Edytuj",
    delete: "Usuń",

    // Generations
    greatGrandparents: "Pradziadkowie",
    grandparents: "Dziadkowie",
    parents: "Rodzice",
    yourGeneration: "Twoje Pokolenie",
    children: "Dzieci",
    grandchildren: "Wnuki",

    // Gallery
    uploadPhotos: "Prześlij Zdjęcia",
    dragDrop: "Przeciągnij i upuść zdjęcia tutaj lub kliknij, aby przeglądać",
    tagMembers: "Oznacz Członków",
    customTags: "Własne Tagi",
    noPhotos: "Brak zdjęć",
    filterByTag: "Filtruj po tagu...",

    // Share
    shareTree: "Udostępnij Drzewo Genealogiczne",
    viewer: "Przeglądający",
    editor: "Edytor",
    viewerDesc: "Może przeglądać drzewo i profile",
    editorDesc: "Może edytować członków i przesyłać zdjęcia",
    copyLink: "Kopiuj Link",
    linkCopied: "Link skopiowany!",

    // AI Chat
    askAboutFamily: "Zapytaj o rodzinę...",
    aiAssistant: "Asystent Rodzinny",
    aiGreeting: "Cześć! Mogę pomóc znaleźć informacje o Twojej rodzinie. Spróbuj zapytać 'Kiedy urodził się Jan?' lub 'Pokaż zdjęcia Marii'",

    // Misc
    age: "Wiek",
    years: "lat",
    born: "Urodzony",
    died: "Zmarł",
    alive: "Żyje",
    deceased: "Zmarły",
    noMembers: "Brak członków rodziny. Dodaj pierwszego członka, aby rozpocząć budowanie drzewa.",
    confirmDelete: "Czy na pewno chcesz usunąć tego członka z drzewa?",
    required: "Wymagane",
    optional: "Opcjonalne",
    notes: "Notatki",
    spouse: "Małżonek",
    parents: "Rodzice",
    selectParents: "Wybierz Rodziców",
    selectSpouse: "Wybierz Małżonka",
    none: "Brak"
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('familyTreeLang') || 'pl';
  });

  useEffect(() => {
    localStorage.setItem('familyTreeLang', language);
  }, [language]);

  const t = (key) => translations[language][key] || key;

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'pl' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

export default LanguageContext;