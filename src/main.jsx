import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { matches, getPageNumbers } from './helpers'
import './styles.css'


function App() {
  const BOOKS_PER_PAGE = 15;

  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [section, setSection] = useState('الكل')
  const [libraryType, setLibraryType] = useState('الكل')
  const [selectedBook, setSelectedBook] = useState(null)
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}books.json`)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load books.json')
        return response.json()
      })
      .then(setBooks)
      .catch(() => setError('تعذر تحميل بيانات الكتب.'))
      .finally(() => setLoading(false))
  }, [])

  const libraryTypes = useMemo(
    () => ['الكل', ...new Set(books.map((book) => book.libraryType).filter(Boolean))],
    [books]
  )

  const sections = useMemo(() => {
    const filtered = libraryType === 'الكل'
      ? books
      : books.filter((book) => book.libraryType === libraryType)

    return ['الكل', ...new Set(filtered.map((book) => book.section).filter(Boolean))]
  }, [books, libraryType])

  useEffect(() => {
    if (!sections.includes(section)) setSection('الكل')
  }, [sections, section])

  useEffect(() => {
    setCurrentPage(1);
  }, [search, section, libraryType]);

  const results = useMemo(() => {
    return books.filter((book) => {
      const queryMatch =
        !search ||
        matches(book.name, search) ||
        matches(book.author, search) ||
        matches(book.section, search)

      const sectionMatch = section === 'الكل' || book.section === section
      const typeMatch = libraryType === 'الكل' || book.libraryType === libraryType

      return queryMatch && sectionMatch && typeMatch
    })
  }, [books, search, section, libraryType])

  const totalPages = Math.ceil(results.length / BOOKS_PER_PAGE);

  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * BOOKS_PER_PAGE;
    const endIndex = startIndex + BOOKS_PER_PAGE;

    return results.slice(startIndex, endIndex);
  }, [results, currentPage]);

  const clearFilters = () => {
    setSearch('')
    setSection('الكل')
    setLibraryType('الكل')
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="brand-logo">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="شعار المكتبة" />
        </div>
        <div className="hero-inner">
          <div className="brand-icon" aria-hidden="true">📚</div>
          <div>
            <p className="eyebrow">إدارة النقل</p>
            <h1>فهرس  المكتبة</h1>
            <p className="subtitle">ابحث عن الكتاب واعرف مكانه داخل المكتبة</p>
          </div>
        </div>
      </header>

      <main className="container">
        <section className="search-card">
          <label className="search-box">
            <span className="search-icon">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم الكتاب أو المؤلف أو القسم..."
              aria-label="البحث"
            />
            {search && (
              <button className="clear-input" onClick={() => setSearch('')} aria-label="مسح البحث">
                ×
              </button>
            )}
          </label>

          <div className="filters">
            <label>
              <span>نوع المكتبة</span>
              <select value={libraryType} onChange={(e) => setLibraryType(e.target.value)}>
                {libraryTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>

            <label>
              <span>القسم</span>
              <select value={section} onChange={(e) => setSection(e.target.value)}>
                {sections.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            {(search || section !== 'الكل' || libraryType !== 'الكل') && (
              <button className="reset" onClick={clearFilters}>مسح الفلاتر</button>
            )}
          </div>
        </section>

        {loading && <div className="state">جاري تحميل الفهرس...</div>}
        {error && <div className="state error">{error}</div>}

        {!loading && !error && (
          <>
            <div className="result-bar">
              <strong>{results.length}</strong>
              <span>{results.length === 1 ? 'كتاب' : 'كتاب'}</span>
            </div>

            {results.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🔎</div>
                <h2>لم يتم العثور على كتب</h2>
                <p>جرب البحث بكلمة أخرى أو غيّر القسم أو نوع المكتبة.</p>
                <button onClick={clearFilters}>عرض جميع الكتب</button>
              </div>
            ) : (
              <div className="book-grid">
                {paginatedResults.map((book) => (
                  <article className="book-card" key={book.id} onClick={() => setSelectedBook(book)}>
                    <div className="book-top">
                      <span className="book-mark">📖</span>
                      {book.libraryType && <span className="badge">{book.libraryType}</span>}
                    </div>
                    <h2>{book.name}</h2>
                    {book.author && <p className="author">✍️ {book.author}</p>}
                    {book.section && <p className="section">القسم: {book.section}</p>}

                    <div className="location">
                      <div className="location-title">📍 مكان الكتاب</div>
                      <div className="location-grid">
                        <div><small>الستاند</small><b>{book.stand ?? '-'}</b></div>
                        <div><small>الرف</small><b>{book.shelf ?? '-'}</b></div>
                        <div><small>الرقم</small><b>{book.number ?? '-'}</b></div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {selectedBook && (
        <div className="modal-backdrop" onClick={() => setSelectedBook(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedBook(null)} aria-label="إغلاق">×</button>
            <div className="modal-book-icon">📖</div>
            <h2>{selectedBook.name}</h2>
            {selectedBook.author && <p className="modal-author">{selectedBook.author}</p>}
            <div className="details">
              {selectedBook.libraryType && <div><span>نوع المكتبة</span><strong>{selectedBook.libraryType}</strong></div>}
              {selectedBook.section && <div><span>القسم</span><strong>{selectedBook.section}</strong></div>}
            </div>
            <div className="big-location">
              <h3>📍 موقع الكتاب</h3>
              <div className="location-grid">
                <div><small>الستاند</small><b>{selectedBook.stand ?? '-'}</b></div>
                <div><small>الرف</small><b>{selectedBook.shelf ?? '-'}</b></div>
                <div><small>رقم الكتاب</small><b>{selectedBook.number ?? '-'}</b></div>
              </div>
            </div>
          </div>
        </div>
      )}
      {totalPages > 1 && (
        <nav className="pagination" aria-label="صفحات النتائج">

          <button
            className="page-arrow"
            onClick={() =>
              setCurrentPage((page) => Math.max(page - 1, 1))
            }
            disabled={currentPage === 1}
          >
            ←
          </button>

          <div className="page-numbers">
            {getPageNumbers(totalPages, currentPage).map((page, index) =>
              page === "..." ? (
                <span className="pagination-dots" key={`dots-${index}`}>
                  …
                </span>
              ) : (
                <button
                  key={page}
                  className={`page-number ${currentPage === page ? "active" : ""
                    }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )
            )}
          </div>

          <button
            className="page-arrow"
            onClick={() =>
              setCurrentPage((page) =>
                Math.min(page + 1, totalPages)
              )
            }
            disabled={currentPage === totalPages}
          >
            →
          </button>

        </nav>
      )}
      <footer>تم الإعداد من فرع نظم المعلومات إدارة النقل - ملازم أ/زياد ضياء الدين</footer>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
