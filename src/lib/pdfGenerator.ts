import jsPDF from 'jspdf'

export interface LavorazionePDF {
  id: string
  titolo: string
  descrizione: string
  stato: string
  priorita: string
  data_apertura: string
  data_completamento?: string
  condominio?: {
    nome: string
    indirizzo?: string
  }
  utente?: {
    nome: string
    cognome: string
    email: string
  }
  note?: string
  allegati?: string
  dati_completamento?: any
}

export class PDFGenerator {
  private doc: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private currentY: number

  constructor() {
    this.doc = new jsPDF()
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.margin = 20
    this.currentY = this.margin
  }

  private addTitle(text: string, fontSize = 18) {
    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(text, this.margin, this.currentY)
    this.currentY += fontSize * 0.7
  }

  private addSubtitle(text: string, fontSize = 14) {
    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(text, this.margin, this.currentY)
    this.currentY += fontSize * 0.6
  }

  private addText(text: string, fontSize = 11, style: 'normal' | 'bold' = 'normal') {
    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', style)
    
    // Gestisce testo multi-linea
    const maxWidth = this.pageWidth - (this.margin * 2)
    const lines = this.doc.splitTextToSize(text, maxWidth)
    
    for (const line of lines) {
      if (this.currentY > this.pageHeight - this.margin - 20) {
        this.addNewPage()
      }
      this.doc.text(line, this.margin, this.currentY)
      this.currentY += fontSize * 0.6
    }
  }

  private addKeyValue(key: string, value: string, fontSize = 11) {
    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'bold')
    
    const keyWidth = this.doc.getTextWidth(key + ': ')
    this.doc.text(key + ':', this.margin, this.currentY)
    
    this.doc.setFont('helvetica', 'normal')
    
    const maxWidth = this.pageWidth - this.margin - keyWidth - 10
    const lines = this.doc.splitTextToSize(value, maxWidth)
    
    let firstLine = true
    for (const line of lines) {
      if (this.currentY > this.pageHeight - this.margin - 20) {
        this.addNewPage()
        firstLine = true
      }
      
      const x = firstLine ? this.margin + keyWidth + 5 : this.margin
      this.doc.text(line, x, this.currentY)
      this.currentY += fontSize * 0.6
      firstLine = false
    }
  }

  private addSeparator() {
    this.currentY += 5
    this.doc.setDrawColor(200, 200, 200)
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 8
  }

  private addNewPage() {
    this.doc.addPage()
    this.currentY = this.margin
  }

  private async addImage(imageUrl: string, maxWidth: number = 150, maxHeight: number = 150) {
    try {
      // Scarica l'immagine
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      
      // Converti in base64 per jsPDF
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      // Determina formato immagine
      const format = imageUrl.includes('.png') ? 'PNG' : 'JPEG'
      
      // Calcola dimensioni mantenendo aspect ratio
      const img = new Image()
      img.src = base64
      await new Promise(resolve => img.onload = resolve)
      
      const aspectRatio = img.width / img.height
      let width = maxWidth
      let height = maxWidth / aspectRatio
      
      if (height > maxHeight) {
        height = maxHeight
        width = maxHeight * aspectRatio
      }
      
      // Controlla se serve nuova pagina
      if (this.currentY + height > this.pageHeight - this.margin - 20) {
        this.addNewPage()
      }
      
      // Aggiungi immagine al PDF
      this.doc.addImage(base64, format, this.margin, this.currentY, width, height)
      this.currentY += height + 10
      
      return true
    } catch (error) {
      console.error('❌ Errore aggiunta immagine al PDF:', error)
      return false
    }
  }

  private addHeader() {
    // Logo/Header azienda (placeholder)
    this.doc.setFillColor(59, 130, 246) // blue-600
    this.doc.rect(0, 0, this.pageWidth, 15, 'F')
    
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('VERIFICHE CONDOMINIALI - REPORT LAVORAZIONE', this.margin, 10)
    
    // Reset colori
    this.doc.setTextColor(0, 0, 0)
    this.currentY = 25
  }

  private addFooter() {
    const pageCount = (this.doc as any).getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      
      // Data generazione
      const now = new Date()
      const dateStr = now.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(100, 100, 100)
      
      // Testo footer
      const footerText = `Report generato il ${dateStr}`
      this.doc.text(footerText, this.margin, this.pageHeight - 15)
      
      // Numero pagina
      const pageText = `Pagina ${i} di ${pageCount}`
      const pageTextWidth = this.doc.getTextWidth(pageText)
      this.doc.text(pageText, this.pageWidth - this.margin - pageTextWidth, this.pageHeight - 15)
      
      // Linea separatrice
      this.doc.setDrawColor(200, 200, 200)
      this.doc.line(this.margin, this.pageHeight - 20, this.pageWidth - this.margin, this.pageHeight - 20)
    }
    
    this.doc.setTextColor(0, 0, 0) // Reset colore
  }

  private getStatoLabel(stato: string): string {
    switch (stato) {
      case 'da_eseguire': return 'DA ESEGUIRE'
      case 'in_corso': return 'IN CORSO'
      case 'completata': return 'COMPLETATA'
      case 'riaperta': return 'RIAPERTA'
      case 'archiviata': return 'ARCHIVIATA'
      default: return stato.toUpperCase()
    }
  }

  private getPrioritaLabel(priorita: string): string {
    switch (priorita) {
      case 'bassa': return 'BASSA'
      case 'media': return 'MEDIA'
      case 'alta': return 'ALTA'
      default: return priorita.toUpperCase()
    }
  }

  generateLavorazionePDF(lavorazione: LavorazionePDF): Promise<Blob> {
    return this._generatePDF(lavorazione)
  }

  private async _generatePDF(lavorazione: LavorazionePDF): Promise<Blob> {
    // Header
    this.addHeader()
    
    // Titolo principale
    this.addTitle(`REPORT LAVORAZIONE`)
    this.currentY += 5
    
    // ID e titolo
    this.addKeyValue('ID Lavorazione', lavorazione.id.substring(0, 8) + '...')
    this.addKeyValue('Titolo', lavorazione.titolo || lavorazione.descrizione)
    this.addSeparator()
    
    // Informazioni generali
    this.addSubtitle('INFORMAZIONI GENERALI')
    this.addKeyValue('Descrizione', lavorazione.descrizione)
    this.addKeyValue('Stato', this.getStatoLabel(lavorazione.stato))
    this.addKeyValue('Priorità', this.getPrioritaLabel(lavorazione.priorita))
    this.addSeparator()
    
    // Condominio
    if (lavorazione.condominio) {
      this.addSubtitle('CONDOMINIO')
      this.addKeyValue('Nome', lavorazione.condominio.nome)
      if (lavorazione.condominio.indirizzo) {
        this.addKeyValue('Indirizzo', lavorazione.condominio.indirizzo)
      }
      this.addSeparator()
    }
    
    // Assegnazione
    if (lavorazione.utente) {
      this.addSubtitle('SOPRALLUOGHISTA ASSEGNATO')
      this.addKeyValue('Nome', `${lavorazione.utente.nome} ${lavorazione.utente.cognome}`)
      this.addKeyValue('Email', lavorazione.utente.email)
      this.addSeparator()
    }
    
    // Timeline
    this.addSubtitle('TIMELINE')
    this.addKeyValue('Data Apertura', new Date(lavorazione.data_apertura).toLocaleString('it-IT'))
    if (lavorazione.data_completamento) {
      this.addKeyValue('Data Completamento', new Date(lavorazione.data_completamento).toLocaleString('it-IT'))
    }
    this.addSeparator()
    
    // Tipologia e dettagli
    if (lavorazione.allegati) {
      try {
        const metadata = JSON.parse(lavorazione.allegati)
        console.log('🔍 PDF Generator - metadata.foto:', metadata.foto)
        console.log('🔍 PDF Generator - foto type:', typeof metadata.foto, Array.isArray(metadata.foto))
        this.addSubtitle('TIPOLOGIA VERIFICA')
        
        let tipoLabel = 'Altro'
        if (metadata.tipologia === 'manutenzione') tipoLabel = 'Manutenzione Ordinaria'
        else if (metadata.tipologia === 'riparazione') tipoLabel = 'Riparazione Urgente'
        else if (metadata.tipologia === 'verifica') tipoLabel = 'Verifica Tecnica'
        else if (metadata.tipologia === 'sicurezza') tipoLabel = 'Sicurezza e Conformità'
        else if (metadata.tipologia === 'pulizia') tipoLabel = 'Pulizia Straordinaria'
        
        this.addKeyValue('Tipo Verifica', tipoLabel)
        
        // Dati del completamento
        if (metadata.dati_verifica_completamento) {
          this.addSubtitle('RISULTATI VERIFICA')
          const dati = metadata.dati_verifica_completamento
          
          Object.entries(dati).forEach(([key, value]) => {
            if (typeof value === 'boolean') {
              this.addKeyValue(key, value ? '✓ Conforme' : '✗ Non conforme')
            } else {
              this.addKeyValue(key, String(value))
            }
          })
        }
        
        // Foto dalla verifica (Vercel Blob o Cloudinary)
        if (metadata.foto && Array.isArray(metadata.foto) && metadata.foto.length > 0) {
          this.addSubtitle('DOCUMENTAZIONE FOTOGRAFICA')
          this.addText(`Numero foto allegate: ${metadata.foto.length}`)
          this.currentY += 5
          
          // Aggiungi foto una per volta
          let fotoAggiunte = 0
          for (const foto of metadata.foto) {
            // Supporta sia stringhe URL (Vercel Blob) che oggetti {url, createdAt} (Cloudinary)
            const fotoUrl = typeof foto === 'string' ? foto : foto.url
            
            if (fotoUrl) {
              console.log(`📸 Aggiungendo foto ${fotoAggiunte + 1}/${metadata.foto.length} al PDF:`, fotoUrl)
              const successo = await this.addImage(fotoUrl, 140, 140)
              if (successo) {
                fotoAggiunte++
                // Aggiungi info foto (opzionale - solo per oggetti con createdAt)
                if (typeof foto === 'object' && foto.createdAt) {
                  this.doc.setFontSize(8)
                  this.doc.setTextColor(100, 100, 100)
                  this.doc.text(
                    `Foto ${fotoAggiunte} - ${new Date(foto.createdAt).toLocaleString('it-IT')}`,
                    this.margin,
                    this.currentY
                  )
                  this.currentY += 8
                  this.doc.setTextColor(0, 0, 0)
                }
              } else {
                console.error(`❌ Impossibile aggiungere foto ${fotoAggiunte + 1}`)
              }
            }
          }
          
          if (fotoAggiunte > 0) {
            console.log(`✅ ${fotoAggiunte}/${metadata.foto.length} foto aggiunte al PDF`)
          } else {
            this.addText('⚠️ Nessuna foto disponibile')
          }
        }
        
        this.addSeparator()
      } catch (e) {
        // Ignora errori di parsing JSON
      }
    }
    
    // Note
    if (lavorazione.note && lavorazione.note.trim()) {
      this.addSubtitle('NOTE')
      this.addText(lavorazione.note)
      this.addSeparator()
    }
    
    // Firma digitale (placeholder)
    this.addSubtitle('VALIDAZIONE')
    this.addText('Questo documento è stato generato automaticamente dal sistema di gestione verifiche condominiali.')
    this.addText(`Data generazione: ${new Date().toLocaleString('it-IT')}`)
    if (lavorazione.stato === 'completata') {
      this.addText('✓ Verifica completata e validata dal sopralluoghista assegnato')
    }
    
    // Footer
    this.addFooter()
    
    return this.doc.output('blob')
  }

  async downloadPDF(lavorazione: LavorazionePDF, filename?: string) {
    const blob = await this.generateLavorazionePDF(lavorazione)
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `lavorazione-${lavorazione.id.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }
}