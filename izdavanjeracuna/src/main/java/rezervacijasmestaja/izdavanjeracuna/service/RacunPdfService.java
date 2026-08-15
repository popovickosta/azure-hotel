package rezervacijasmestaja.izdavanjeracuna.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.format.DateTimeFormatter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import rezervacijasmestaja.izdavanjeracuna.domen.Racun;
import rezervacijasmestaja.izdavanjeracuna.domen.StavkaRacuna;
import rezervacijasmestaja.izdavanjeracuna.repository.RacunRepository;

@Service
public class RacunPdfService {

    @Autowired
    private RacunRepository racunRepository;

    private static final DateTimeFormatter DATUM_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy.");

    public byte[] generisiPdf(Long racunId) {
        Racun racun = racunRepository.findById(racunId)
                .orElseThrow(() -> new RuntimeException("Račun nije pronađen"));

        try {
            Document document = new Document(PageSize.A4, 50, 50, 50, 50);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter.getInstance(document, baos);

            document.open();

            // Cp1250 omogućava pravilno prikazivanje srpske latinice (č, ć, š, ž, đ)
            // bez dodavanja posebnog font fajla u projekat.
            BaseFont baseFont = BaseFont.createFont(BaseFont.HELVETICA, "Cp1250", BaseFont.NOT_EMBEDDED);
            Font naslovFont = new Font(baseFont, 20, Font.BOLD);
            Font podnaslovFont = new Font(baseFont, 11, Font.NORMAL);
            Font normalFont = new Font(baseFont, 11, Font.NORMAL);
            Font boldFont = new Font(baseFont, 11, Font.BOLD);

            Paragraph naslov = new Paragraph("Račun - Azure Hotel", naslovFont);
            naslov.setAlignment(Element.ALIGN_CENTER);
            document.add(naslov);

            Paragraph datum = new Paragraph(
                    "Datum izdavanja: " + racun.getDatumIzdavanja().format(DATUM_FORMAT),
                    podnaslovFont);
            datum.setAlignment(Element.ALIGN_CENTER);
            datum.setSpacingAfter(20);
            document.add(datum);

            var rezervacija = racun.getRezervacija();
            var gost = rezervacija.getGost();
            var soba = rezervacija.getSoba();

            Paragraph gostInfo = new Paragraph();
            gostInfo.add(new Chunk("Gost: ", boldFont));
            gostInfo.add(new Chunk(gost.getIme() + " " + gost.getPrezime(), normalFont));
            document.add(gostInfo);

            Paragraph emailInfo = new Paragraph();
            emailInfo.add(new Chunk("Email: ", boldFont));
            emailInfo.add(new Chunk(gost.getEmail(), normalFont));
            document.add(emailInfo);

            Paragraph sobaInfo = new Paragraph();
            sobaInfo.add(new Chunk("Soba: ", boldFont));
            sobaInfo.add(new Chunk(String.valueOf(soba.getBrojSobe()), normalFont));
            document.add(sobaInfo);

            Paragraph periodInfo = new Paragraph();
            periodInfo.add(new Chunk("Period: ", boldFont));
            periodInfo.add(new Chunk(
                    rezervacija.getDatumPrijave().format(DATUM_FORMAT) + " - "
                    + rezervacija.getDatumOdjave().format(DATUM_FORMAT),
                    normalFont));
            periodInfo.setSpacingAfter(20);
            document.add(periodInfo);

            PdfPTable tabela = new PdfPTable(4);
            tabela.setWidthPercentage(100);
            tabela.setWidths(new float[]{4f, 1.5f, 2f, 2f});

            dodajHeaderCeliju(tabela, "Naziv", boldFont);
            dodajHeaderCeliju(tabela, "Količina", boldFont);
            dodajHeaderCeliju(tabela, "Cena po jed.", boldFont);
            dodajHeaderCeliju(tabela, "Iznos", boldFont);

            for (StavkaRacuna stavka : racun.getStavke()) {
                tabela.addCell(new Phrase(prikazNaziva(stavka.getNaziv()), normalFont));
                tabela.addCell(new Phrase(String.valueOf(stavka.getKolicina()), normalFont));
                tabela.addCell(new Phrase(formatIznos(stavka.getCenaPoJedinici()) + " RSD", normalFont));

                BigDecimal iznos = stavka.getCenaPoJedinici()
                        .multiply(BigDecimal.valueOf(stavka.getKolicina()));
                tabela.addCell(new Phrase(formatIznos(iznos) + " RSD", normalFont));
            }

            document.add(tabela);

            Paragraph ukupno = new Paragraph(
                    "\nUkupan iznos: " + formatIznos(racun.getUkupanIznos()) + " RSD",
                    new Font(baseFont, 14, Font.BOLD));
            ukupno.setAlignment(Element.ALIGN_RIGHT);
            ukupno.setSpacingBefore(15);
            document.add(ukupno);

            document.close();
            return baos.toByteArray();

        } catch (DocumentException | IOException e) {
            throw new RuntimeException("Greška prilikom generisanja PDF-a", e);
        }
    }

    private String formatIznos(BigDecimal iznos) {
        DecimalFormatSymbols simboli = new DecimalFormatSymbols();
        simboli.setGroupingSeparator('.');
        simboli.setDecimalSeparator(',');
        DecimalFormat format = new DecimalFormat("#,##0.##", simboli);
        return format.format(iznos);
    }

    private String prikazNaziva(String naziv) {
        if (naziv == null) return "";
        if (naziv.equalsIgnoreCase("Dorucak") || naziv.equalsIgnoreCase("Doručak")) return "Doručak";
        if (naziv.equalsIgnoreCase("Rucak") || naziv.equalsIgnoreCase("Ručak")) return "Ručak";
        if (naziv.equalsIgnoreCase("Vecera") || naziv.equalsIgnoreCase("Večera")) return "Večera";
        if (naziv.equalsIgnoreCase("Pranje vesa") || naziv.equalsIgnoreCase("Pranje veša")) return "Pranje veša";
        return naziv;
    }

    private void dodajHeaderCeliju(PdfPTable tabela, String tekst, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(tekst, font));
        cell.setBackgroundColor(new Color(230, 230, 230));
        cell.setPadding(6);
        tabela.addCell(cell);
    }
}
